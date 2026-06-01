import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyStoreApiKey, jsonOk, jsonError, logApiHit } from "@/backend/store/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; branchSlug: string; invoiceNumber: string }> }) {
  const { businessSlug, branchSlug, invoiceNumber } = await params;
  const { store, error } = await verifyStoreApiKey(businessSlug, branchSlug, req.headers.get("x-api-key"));
  if (!store) return jsonError(error!, 401);

  const sale = await prisma.sale.findFirst({
    where: { invoiceNumber, ownerId: store.ownerId },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, imageLink: true } } },
      },
    },
  });

  if (!sale) return jsonError("Invoice not found", 404);

  await logApiHit(store.id, `/sales/${invoiceNumber}`, "GET", 200, req.headers.get("x-forwarded-for"));

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
      orderStatus: sale.orderStatus,
      deliveryAddress: sale.deliveryAddress,
      createdAt: sale.createdAt.toISOString(),
      items: sale.items.map((i) => ({
        productId: i.productId,
        productName: i.product.name,
        productImage: i.product.imageLink,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; branchSlug: string; invoiceNumber: string }> }) {
  const { businessSlug, branchSlug, invoiceNumber } = await params;
  const { store, error } = await verifyStoreApiKey(businessSlug, branchSlug, req.headers.get("x-api-key"));
  if (!store) return jsonError(error!, 401);

  let body: { paidAmount?: number; paymentStatus?: string; orderStatus?: string; deliveryAddress?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const sale = await prisma.sale.findFirst({
    where: { invoiceNumber, ownerId: store.ownerId },
  });

  if (!sale) return jsonError("Invoice not found", 404);

  const updateData: any = {};

  if (body.paidAmount !== undefined) {
    const paid = Math.min(Math.max(0, body.paidAmount), sale.finalAmount);
    const due = sale.finalAmount - paid;
    updateData.paidAmount = paid;
    updateData.dueAmount = due;
    updateData.paymentStatus = body.paymentStatus || (due <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID");
  }

  if (body.orderStatus) {
    const validStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];
    if (!validStatuses.includes(body.orderStatus)) {
      return jsonError(`Invalid orderStatus. Must be one of: ${validStatuses.join(", ")}`);
    }
    updateData.orderStatus = body.orderStatus;
  }

  if (body.deliveryAddress !== undefined) {
    updateData.deliveryAddress = body.deliveryAddress;
  }

  if (Object.keys(updateData).length === 0) {
    return jsonError("No valid fields to update");
  }

  const updated = await prisma.sale.update({
    where: { id: sale.id },
    data: updateData,
  });

  await logApiHit(store.id, `/sales/${invoiceNumber}`, "PATCH", 200, req.headers.get("x-forwarded-for"));

  return jsonOk({
    invoice: {
      invoiceNumber: updated.invoiceNumber,
      paymentStatus: updated.paymentStatus,
      paidAmount: updated.paidAmount,
      dueAmount: updated.dueAmount,
      orderStatus: updated.orderStatus,
      deliveryAddress: updated.deliveryAddress,
    },
  });
}
