export type BuyerType = "PLATFORM_USER" | "EXTERNAL";
export type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";

export interface SalesListItem {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  buyerType: BuyerType;
  buyerId: string | null;
  buyerBusinessName: string | null;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  dueAmount: number;
  orderStatus: OrderStatus;
  itemCount: number;
  createdAt: string;
}

export interface SaleItemDetail {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleDetail extends SalesListItem {
  items: SaleItemDetail[];
  deliveryAddress: string | null;
  deliveryDate: string | null;
  notes: string | null;
}

export interface SaleStats {
  totalSales: number;
  totalRevenue: number;
  totalDue: number;
  totalPaid: number;
  avgSaleValue: number;
  salesToday: number;
  revenueToday: number;
  salesThisMonth: number;
  revenueThisMonth: number;
  paidCount: number;
  unpaidCount: number;
  partialCount: number;
  platformUserSales: number;
  externalSales: number;
}

export interface PlatformUser {
  id: string;
  name: string;
  businessName: string | null;
  phone: string | null;
  profileImage: string | null;
}

export interface OwnerProduct {
  id: string;
  name: string;
  sellingPrice: number;
  quantity: number;
  unit: string;
  imageLink: string | null;
  category: string | null;
}

export interface SalesListResponse {
  sales: SalesListItem[];
  total: number;
  totalPages: number;
  page: number;
}
