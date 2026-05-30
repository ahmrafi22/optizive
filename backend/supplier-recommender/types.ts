export interface SupplierSummary {
  id: string;
  businessName: string | null;
  name: string;
  profileImage: string | null;
  primaryCategory: string | null;
  avgRating: number;
  totalTransactions: number;
  isVerified: boolean;
  deliveryTimeRange: string | null;
  pricingType: string | null;
  supplierTags: string[];
  bulkDiscountAvailable: boolean | null;
  district: string | null;
  area: string | null;
  serviceArea: string | null;
  serviceRadiusKm: number | null;
  productCount: number;
  matchScore: number;
}

export interface SupplierDetail extends SupplierSummary {
  businessType: string | null;
  businessSize: string | null;
  yearsInBusiness: number | null;
  deliveryMethod: string | null;
  orderCapacity: string | null;
  minOrderValue: number | null;
  maxOrderValue: number | null;
  paymentTerms: string | null;
  businessRegistrationId: string | null;
  lastActiveAt: string | null;
  description?: string | null;
  subCategories: string[];
  products: SupplierProduct[];
}

export interface SupplierProduct {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  sellingPrice: number;
  costPrice: number;
  imageLink: string | null;
  unit: string;
  quantity: number;
  minStock: number | null;
  expiryDate: string | null;
  batchNumber: string | null;
  barcode: string | null;
  sku: string | null;
  isActive: boolean;
}

export interface SupplierSearchFilters {
  search?: string;
  category?: string;
  district?: string;
  pricingType?: string;
  deliveryTime?: string;
  minRating?: number;
  tags?: string[];
  bulkDiscount?: boolean;
  sort?: "rating" | "matchScore" | "delivery" | "transactions";
  limit?: number;
  offset?: number;
}

export interface SupplierSearchResponse {
  items: SupplierSummary[];
  totalCount: number;
  filters: {
    categories: { value: string; count: number }[];
    districts: { value: string; count: number }[];
  };
}

export interface RestockSuggestion {
  productId: string;
  productName: string;
  productCategory: string | null;
  suppliers: SupplierSummary[];
}

export interface BulkDiscountAlert {
  supplierId: string;
  supplierName: string;
  supplierBusinessName: string | null;
  category: string | null;
  supplierTags: string[];
  avgRating: number;
}
