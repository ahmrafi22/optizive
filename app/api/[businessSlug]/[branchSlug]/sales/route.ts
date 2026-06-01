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

interface CreateSaleItem {
  productId: string;
  quantity: number;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; branchSlug: string }> }) {
  const { businessSlug, branchSlug } = await params;
  const { store, error } = await verifyStoreApiKey(businessSlug, branchSlug, req.headers.get("x-api-key"));
  if (!store) return jsonError(error!, 401);

  let body: {
    items: CreateSaleItem[];
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
    return jsonError("Invalid JSON body");
  }

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return jsonError("items must be a non-empty array");
  }

  const productIds = body.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, ownerId: store.ownerId, isActive: true },
    select: { id: true, name: true, sellingPrice: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  const saleItems: { productId: string; quantity: number; unitPrice: number; totalPrice: number }[] = [];

  for (const item of body.items) {
    const product = productMap.get(item.productId);
    if (!product) return jsonError(`Product ${item.productId} not found or inactive`);
    if (item.quantity <= 0) return jsonError(`Invalid quantity for ${item.productId}`);
    saleItems.push({
      productId: product.id,
      quantity: item.quantity,
      unitPrice: product.sellingPrice,
      totalPrice: product.sellingPrice * item.quantity,
    });
  }

  const totalAmount = saleItems.reduce((s, i) => s + i.totalPrice, 0);
  const discount = Math.min(Math.max(0, body.discount || 0), totalAmount);
  const finalAmount = totalAmount - discount;
  const paidAmount = Math.min(Math.max(0, body.paidAmount || 0), finalAmount);
  const dueAmount = finalAmount - paidAmount;
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
      finalAmount,
      paymentStatus: paymentStatus as any,
      paidAmount,
      dueAmount,
      deliveryAddress: body.deliveryAddress || null,
      notes: body.notes ? `[${store.name}] ${body.notes}` : `[${store.name}]`,
      items: { create: saleItems },
    },
    include: {
      items: {
        include: { product: { select: { id: true, name: true } } },
      },
    },
  });

  await logApiHit(store.id, "/sales", "POST", 200, req.headers.get("x-forwarded-for"));

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; branchSlug: string }> }) {
  const { businessSlug, branchSlug } = await params;
  const { store, error } = await verifyStoreApiKey(businessSlug, branchSlug, req.headers.get("x-api-key"));
  if (!store) return jsonError(error!, 401);

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));

  const where: any = { ownerId: store.ownerId };
  const status = searchParams.get("paymentStatus");
  if (status) where.paymentStatus = status;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        finalAmount: true,
        paymentStatus: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);

  await logApiHit(store.id, "/sales", "GET", 200, req.headers.get("x-forwarded-for"));

  return jsonOk({
    sales: sales.map((s) => ({
      invoiceNumber: s.invoiceNumber,
      customerName: s.customerName,
      total: s.finalAmount,
      paymentStatus: s.paymentStatus,
      itemCount: s._count.items,
      createdAt: s.createdAt.toISOString(),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
