"use server";

import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import {
  ProcurementRequestStatus,
  BuyerType,
  OrderStatus,
} from "@/prisma/generated/prisma/client";

export interface ProcurementRequestItemData {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ProcurementRequestDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  buyerId: string;
  buyerName: string;
  buyerBusinessName: string | null;
  buyerImage: string | null;
  supplierId: string;
  supplierName: string;
  supplierBusinessName: string | null;
  supplierImage: string | null;
  status: ProcurementRequestStatus;
  notes: string | null;
  totalAmount: number;
  items: ProcurementRequestItemData[];
  saleId: string | null;
  saleInvoiceNumber: string | null;
}

export interface ProcurementRequestSummary {
  id: string;
  createdAt: string;
  status: ProcurementRequestStatus;
  counterpartyId: string;
  counterpartyName: string;
  counterpartyBusinessName: string | null;
  counterpartyImage: string | null;
  itemCount: number;
  totalAmount: number;
  notes: string | null;
  saleId: string | null;
}

export async function createProcurementRequest(input: {
  supplierId: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}): Promise<ProcurementRequestDetail | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const supplier = await prisma.user.findFirst({
    where: { id: input.supplierId, isActive: true },
  });
  if (!supplier) return null;

  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, ownerId: input.supplierId, isActive: true },
    select: { id: true, name: true, sellingPrice: true, quantity: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const itemsData = input.items.map((item) => {
    const product = productMap.get(item.productId);
    const unitPrice = product?.sellingPrice ?? 0;
    return {
      productId: item.productId,
      productName: product?.name ?? "Unknown Product",
      quantity: item.quantity,
      unitPrice,
      totalPrice: item.quantity * unitPrice,
    };
  });

  const totalAmount = itemsData.reduce((sum, i) => sum + i.totalPrice, 0);

  const request = await prisma.procurementRequest.create({
    data: {
      buyerId: userId,
      supplierId: input.supplierId,
      notes: input.notes || null,
      items: { create: itemsData },
    },
    include: {
      items: true,
      buyer: { select: { id: true, name: true, businessName: true, profileImage: true } },
      supplier: { select: { id: true, name: true, businessName: true, profileImage: true } },
      sale: { select: { id: true, invoiceNumber: true } },
    },
  });

  return formatDetail(request);
}

export async function listSentRequests(limit?: number): Promise<ProcurementRequestSummary[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const requests = await prisma.procurementRequest.findMany({
    where: { buyerId: userId },
    orderBy: { createdAt: "desc" },
    take: limit ?? 50,
    include: {
      items: { select: { id: true, totalPrice: true } },
      supplier: { select: { id: true, name: true, businessName: true, profileImage: true } },
      sale: { select: { id: true, invoiceNumber: true } },
    },
  });

  return requests.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    status: r.status as ProcurementRequestStatus,
    counterpartyId: r.supplier.id,
    counterpartyName: r.supplier.name,
    counterpartyBusinessName: r.supplier.businessName,
    counterpartyImage: r.supplier.profileImage,
    itemCount: r.items.length,
    totalAmount: r.items.reduce((s, i) => s + i.totalPrice, 0),
    notes: r.notes,
    saleId: r.sale?.id ?? null,
  }));
}

export async function listReceivedRequests(limit?: number): Promise<ProcurementRequestSummary[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const requests = await prisma.procurementRequest.findMany({
    where: { supplierId: userId },
    orderBy: { createdAt: "desc" },
    take: limit ?? 50,
    include: {
      items: { select: { id: true, totalPrice: true } },
      buyer: { select: { id: true, name: true, businessName: true, profileImage: true } },
      sale: { select: { id: true, invoiceNumber: true } },
    },
  });

  return requests.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    status: r.status as ProcurementRequestStatus,
    counterpartyId: r.buyer.id,
    counterpartyName: r.buyer.name,
    counterpartyBusinessName: r.buyer.businessName,
    counterpartyImage: r.buyer.profileImage,
    itemCount: r.items.length,
    totalAmount: r.items.reduce((s, i) => s + i.totalPrice, 0),
    notes: r.notes,
    saleId: r.sale?.id ?? null,
  }));
}

export async function getProcurementRequestDetail(id: string): Promise<ProcurementRequestDetail | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const request = await prisma.procurementRequest.findFirst({
    where: {
      id,
      OR: [{ buyerId: userId }, { supplierId: userId }],
    },
    include: {
      items: true,
      buyer: { select: { id: true, name: true, businessName: true, profileImage: true } },
      supplier: { select: { id: true, name: true, businessName: true, profileImage: true } },
      sale: { select: { id: true, invoiceNumber: true } },
    },
  });

  if (!request) return null;

  return formatDetail(request);
}

export async function acceptProcurementRequest(id: string): Promise<ProcurementRequestDetail | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const request = await prisma.procurementRequest.findFirst({
    where: { id, supplierId: userId, status: "PENDING" },
    include: { items: true },
  });
  if (!request) return null;

  const totalAmount = request.items.reduce((s, i) => s + i.totalPrice, 0);

  const result = await prisma.$transaction(async (tx) => {
    // Update request status
    const updated = await tx.procurementRequest.update({
      where: { id },
      data: { status: "APPROVED" },
      include: {
        items: true,
        buyer: { select: { id: true, name: true, businessName: true, profileImage: true } },
        supplier: { select: { id: true, name: true, businessName: true, profileImage: true } },
      },
    });

    // Generate invoice number
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, "0");
    const d = now.getDate().toString().padStart(2, "0");
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    let invoiceNumber = `INV-${y}${m}${d}-${rand}`;
    let attempts = 0;
    while (attempts < 5) {
      const existing = await tx.sale.findUnique({ where: { invoiceNumber } });
      if (!existing) break;
      invoiceNumber = `INV-${y}${m}${d}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      attempts++;
    }

    // Create sale (supplier sells to buyer)
    const sale = await tx.sale.create({
      data: {
        ownerId: userId,
        invoiceNumber,
        buyerType: "PLATFORM_USER",
        buyerId: request.buyerId,
        totalAmount,
        discount: 0,
        finalAmount: totalAmount,
        paymentStatus: "UNPAID",
        paidAmount: 0,
        dueAmount: totalAmount,
        orderStatus: "CONFIRMED",
        items: {
          create: request.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
    });

    // Link sale to request
    await tx.procurementRequest.update({
      where: { id },
      data: { saleId: sale.id },
    });

    // Update supplier inventory (decrease)
    for (const item of request.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    // Update/create buyer inventory
    for (const item of request.items) {
      const existingProduct = await tx.product.findFirst({
        where: {
          ownerId: request.buyerId,
          name: { equals: item.productName, mode: "insensitive" },
          isActive: true,
        },
        select: { id: true, quantity: true },
      });

      if (existingProduct) {
        await tx.product.update({
          where: { id: existingProduct.id },
          data: { quantity: { increment: item.quantity } },
        });
      } else {
        const supplierProduct = await tx.product.findUnique({
          where: { id: item.productId },
          select: { description: true, category: true, imageLink: true, unit: true, costPrice: true, sellingPrice: true, sku: true },
        });

        await tx.product.create({
          data: {
            ownerId: request.buyerId,
            supplierId: userId,
            name: item.productName,
            description: supplierProduct?.description,
            category: supplierProduct?.category,
            imageLink: supplierProduct?.imageLink,
            unit: supplierProduct?.unit ?? "PCS",
            costPrice: supplierProduct?.costPrice ?? 0,
            sellingPrice: item.unitPrice,
            quantity: item.quantity,
            isActive: true,
          },
        });
      }
    }

    return updated;
  });

  const sale = await prisma.sale.findFirst({
    where: { procurementRequest: { id } },
    select: { id: true, invoiceNumber: true },
  });

  return {
    ...formatDetail(result),
    saleId: sale?.id ?? null,
    saleInvoiceNumber: sale?.invoiceNumber ?? null,
  };
}

export async function rejectProcurementRequest(id: string): Promise<ProcurementRequestDetail | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const request = await prisma.procurementRequest.findFirst({
    where: { id, supplierId: userId, status: "PENDING" },
    include: { items: true },
  });
  if (!request) return null;

  const updated = await prisma.procurementRequest.update({
    where: { id },
    data: { status: "REJECTED" },
    include: {
      items: true,
      buyer: { select: { id: true, name: true, businessName: true, profileImage: true } },
      supplier: { select: { id: true, name: true, businessName: true, profileImage: true } },
      sale: { select: { id: true, invoiceNumber: true } },
    },
  });

  return formatDetail(updated);
}

export async function getProcurementCounts(): Promise<{ sentPending: number; receivedPending: number }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { sentPending: 0, receivedPending: 0 };

  const [sentPending, receivedPending] = await Promise.all([
    prisma.procurementRequest.count({ where: { buyerId: userId, status: "PENDING" } }),
    prisma.procurementRequest.count({ where: { supplierId: userId, status: "PENDING" } }),
  ]);

  return { sentPending, receivedPending };
}

function formatDetail(request: any): ProcurementRequestDetail {
  return {
    id: request.id,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    buyerId: request.buyerId,
    buyerName: request.buyer.name,
    buyerBusinessName: request.buyer.businessName,
    buyerImage: request.buyer.profileImage,
    supplierId: request.supplierId,
    supplierName: request.supplier.name,
    supplierBusinessName: request.supplier.businessName,
    supplierImage: request.supplier.profileImage,
    status: request.status as ProcurementRequestStatus,
    notes: request.notes,
    totalAmount: request.items.reduce((s: number, i: any) => s + i.totalPrice, 0),
    items: request.items.map((i: any) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    })),
    saleId: request.sale?.id ?? null,
    saleInvoiceNumber: request.sale?.invoiceNumber ?? null,
  };
}
