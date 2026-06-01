import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyStoreApiKey, jsonOk, jsonError, logApiHit } from "@/backend/store/api-auth";

function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ST-${y}${m}${d}-${rand}`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; branchSlug: string; id: string }> }) {
  const { businessSlug, branchSlug, id } = await params;
  const { store, error } = await verifyStoreApiKey(businessSlug, branchSlug, req.headers.get("x-api-key"));
  if (!store) return jsonError(error!, 401);

  let body: {
    customerName?: string;
    customerPhone?: string;
    discount?: number;
    paidAmount?: number;
    deliveryAddress?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const basket = await prisma.smartBasket.findFirst({
    where: { id, ownerId: store.ownerId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, sellingPrice: true } },
        },
      },
    },
  });

  if (!basket) return jsonError("Smart basket not found", 404);
  if (basket.items.length === 0) return jsonError("Smart basket is empty");

  const saleItems = basket.items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    unitPrice: i.product.sellingPrice,
    totalPrice: i.product.sellingPrice * i.quantity,
  }));

  const totalAmount = saleItems.reduce((s, i) => s + i.totalPrice, 0);
  const finalAmount = basket.customTotal !== null && basket.customTotal > 0
    ? basket.customTotal
    : totalAmount;
  const discount = Math.min(Math.max(0, body.discount || 0), finalAmount);
  const afterDiscount = finalAmount - discount;
  const paidAmount = Math.min(Math.max(0, body.paidAmount || 0), afterDiscount);
  const dueAmount = afterDiscount - paidAmount;
  const paymentStatus = dueAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";

  let invoiceNumber = generateInvoiceNumber();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.sale.findUnique({ where: { invoiceNumber } });
    if (!existing) break;
    invoiceNumber = generateInvoiceNumber();
    attempts++;
  }

  const sale = await prisma.sale.create({
    data: {
      ownerId: store.ownerId,
      invoiceNumber,
      customerName: body.customerName || null,
      customerPhone: body.customerPhone || null,
      buyerType: "EXTERNAL",
      totalAmount,
      discount,
      finalAmount: afterDiscount,
      paymentStatus: paymentStatus as any,
      paidAmount,
      dueAmount,
      deliveryAddress: body.deliveryAddress || null,
      notes: body.notes
        ? `[${store.name}] ${body.notes} (Smart Basket: ${basket.title})`
        : `[${store.name}] Smart Basket: ${basket.title}`,
      items: { create: saleItems },
    },
    include: {
      items: {
        include: { product: { select: { id: true, name: true } } },
      },
    },
  });

  await logApiHit(store.id, `/smart-baskets/${id}/buy`, "POST", 200, req.headers.get("x-forwarded-for"));

  return jsonOk({
    invoice: {
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      totalAmount: sale.totalAmount,
      discount: sale.discount,
      finalAmount: sale.finalAmount,
      paymentStatus: sale.paymentStatus,
      paidAmount: sale.paidAmount,
      dueAmount: sale.dueAmount,
      createdAt: sale.createdAt.toISOString(),
      smartBasket: basket.title,
      items: sale.items.map((i) => ({
        productId: i.productId,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
    },
  }, 201);
}
