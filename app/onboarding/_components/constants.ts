import type { UserRole, RoleOption, SelectOption } from "./types";

export const ROLE_OPTIONS: RoleOption[] = [
  { value: "STORE_OWNER", title: "Store Owner", blurb: "Buying for a shop or outlet" },
  { value: "SUPPLIER", title: "Supplier", blurb: "Selling inventory to others" },
  { value: "BOTH", title: "Both", blurb: "Buying and supplying" },
];

export const BUSINESS_TYPES: SelectOption[] = [
  { value: "RETAILER", label: "Retailer" },
  { value: "WHOLESALER", label: "Wholesaler" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "MANUFACTURER", label: "Manufacturer" },
  { value: "IMPORTER", label: "Importer" },
  { value: "EXPORTER", label: "Exporter" },
  { value: "TRADER", label: "Trader" },
  { value: "PROCESSOR", label: "Processor" },
  { value: "AGRO_PROCESSOR", label: "Agro processor" },
  { value: "APPAREL_FACTORY", label: "Apparel factory" },
  { value: "SERVICE_PROVIDER", label: "Service provider" },
];

export const BUSINESS_SIZES: SelectOption[] = [
  { value: "SMALL", label: "Small" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LARGE", label: "Large" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

export const CATEGORIES: SelectOption[] = [
  { value: "GROCERIES", label: "Groceries" },
  { value: "FMCG", label: "FMCG" },
  { value: "FRESH_PRODUCE", label: "Fresh produce" },
  { value: "AGRO_PRODUCTS", label: "Agro products" },
  { value: "FISHERY_SEAFOOD", label: "Fishery and seafood" },
  { value: "MEAT_POULTRY", label: "Meat and poultry" },
  { value: "DAIRY", label: "Dairy" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "MOBILE_ACCESSORIES", label: "Mobile accessories" },
  { value: "CLOTHING", label: "Clothing" },
  { value: "TEXTILES_APPAREL", label: "Textiles and apparel" },
  { value: "FOOTWEAR", label: "Footwear" },
  { value: "BEAUTY_PERSONAL_CARE", label: "Beauty and personal care" },
  { value: "HOME_APPLIANCE", label: "Home appliances" },
  { value: "FURNITURE", label: "Furniture" },
  { value: "HARDWARE", label: "Hardware" },
  { value: "CONSTRUCTION_MATERIALS", label: "Construction materials" },
  { value: "AUTO_PARTS", label: "Auto parts" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "STATIONERY", label: "Stationery" },
  { value: "OFFICE_SUPPLIES", label: "Office supplies" },
  { value: "PACKAGING", label: "Packaging" },
  { value: "CHEMICALS", label: "Chemicals" },
  { value: "PLASTICS", label: "Plastics" },
  { value: "RESTAURANT_SUPPLY", label: "Restaurant supply" },
  { value: "HOSPITALITY_SUPPLY", label: "Hospitality supply" },
  { value: "OTHER", label: "Other" },
];

export const PRICING_TYPES: SelectOption[] = [
  { value: "BUDGET", label: "Budget" },
  { value: "VALUE", label: "Value" },
  { value: "MID_RANGE", label: "Mid range" },
  { value: "PREMIUM", label: "Premium" },
];

export const DELIVERY_TIMES: SelectOption[] = [
  { value: "SAME_DAY", label: "Same day" },
  { value: "NEXT_DAY", label: "Next day" },
  { value: "TWO_THREE_DAYS", label: "2-3 days" },
  { value: "WITHIN_WEEK", label: "Within week" },
  { value: "FLEXIBLE", label: "Flexible" },
];

export const DISTANCE_PREFERENCES: SelectOption[] = [
  { value: "NEIGHBORHOOD", label: "Neighborhood" },
  { value: "LOCAL", label: "Local" },
  { value: "CITY", label: "City" },
  { value: "REGIONAL", label: "Regional" },
  { value: "NATIONWIDE", label: "Nationwide" },
  { value: "INTERNATIONAL", label: "International" },
];

export const SERVICE_AREAS: SelectOption[] = [
  { value: "LOCAL", label: "Local" },
  { value: "CITY", label: "City" },
  { value: "REGIONAL", label: "Regional" },
  { value: "NATIONWIDE", label: "Nationwide" },
  { value: "INTERNATIONAL", label: "International" },
];

export const DELIVERY_METHODS: SelectOption[] = [
  { value: "SELF", label: "Self delivery" },
  { value: "COURIER", label: "Courier" },
  { value: "BOTH", label: "Both" },
  { value: "PICKUP", label: "Pickup" },
  { value: "FREIGHT", label: "Freight" },
];

export const BUYING_PRIORITIES: SelectOption[] = [
  { value: "CHEAP", label: "Low cost" },
  { value: "FAST", label: "Fast" },
  { value: "QUALITY", label: "Quality" },
  { value: "RELIABILITY", label: "Reliability" },
  { value: "CONSISTENCY", label: "Consistency" },
];

export const NEGOTIATION_PREFERENCES: SelectOption[] = [
  { value: "FLEXIBLE", label: "Flexible" },
  { value: "FIXED", label: "Fixed" },
  { value: "NO_NEGOTIATION", label: "No negotiation" },
];

export const MONTHLY_PURCHASE_RANGES: SelectOption[] = [
  { value: "UNDER_500", label: "Under 500" },
  { value: "500_2000", label: "500 - 2,000" },
  { value: "2000_10000", label: "2,000 - 10,000" },
  { value: "10000_PLUS", label: "10,000+" },
];

export const RESTOCK_FREQUENCIES: SelectOption[] = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "SEASONAL", label: "Seasonal" },
];

export const SUPPLIER_TAGS: SelectOption[] = [
  { value: "FAST_DELIVERY", label: "Fast delivery" },
  { value: "BULK_DISCOUNT", label: "Bulk discount" },
  { value: "PREMIUM_QUALITY", label: "Premium quality" },
  { value: "LOW_PRICE", label: "Low price" },
  { value: "FACTORY_DIRECT", label: "Factory direct" },
  { value: "CASH_ON_DELIVERY", label: "Cash on delivery" },
  { value: "VAT_INVOICE", label: "VAT invoice" },
  { value: "HALAL_CERTIFIED", label: "Halal certified" },
  { value: "BSTI_CERTIFIED", label: "BSTI certified" },
  { value: "EXPORT_READY", label: "Export ready" },
  { value: "COLD_CHAIN", label: "Cold chain" },
  { value: "SAMPLE_AVAILABLE", label: "Sample available" },
];

export const ORDER_CAPACITY = BUSINESS_SIZES;

export const BULK_DISCOUNT_OPTIONS: SelectOption[] = [
  { label: "available", value: "true" },
  { label: "not available", value: "false" },
];
