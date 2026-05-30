import Link from "next/link";
import {
  LuPackage,
  LuShoppingCart,
  LuSprout,
  LuTractor,
  LuFish,
  LuBone,
  LuMilk,
  LuMonitor,
  LuSmartphone,
  LuShirt,
  LuFootprints,
  LuSparkles,
  LuCpu,
  LuSofa,
  LuWrench,
  LuBuilding,
  LuBuilding2,
  LuCar,
  LuPill,
  LuScissors,
  LuBoxes,
  LuFlaskRound,
  LuCylinder,
  LuUtensils,
  LuCircleCheck,
  LuTriangleAlert,
  LuCircleX,
} from "react-icons/lu";
import type { SupplierProduct } from "@/backend/supplier-recommender/types";

const CURRENCY = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GROCERIES: LuShoppingCart,
  FMCG: LuPackage,
  FRESH_PRODUCE: LuSprout,
  AGRO_PRODUCTS: LuTractor,
  FISHERY_SEAFOOD: LuFish,
  MEAT_POULTRY: LuBone,
  DAIRY: LuMilk,
  ELECTRONICS: LuMonitor,
  MOBILE_ACCESSORIES: LuSmartphone,
  CLOTHING: LuShirt,
  TEXTILES_APPAREL: LuShirt,
  FOOTWEAR: LuFootprints,
  BEAUTY_PERSONAL_CARE: LuSparkles,
  HOME_APPLIANCE: LuCpu,
  FURNITURE: LuSofa,
  HARDWARE: LuWrench,
  CONSTRUCTION_MATERIALS: LuBuilding,
  AUTO_PARTS: LuCar,
  PHARMACY: LuPill,
  STATIONERY: LuScissors,
  OFFICE_SUPPLIES: LuBoxes,
  PACKAGING: LuPackage,
  CHEMICALS: LuFlaskRound,
  PLASTICS: LuCylinder,
  RESTAURANT_SUPPLY: LuUtensils,
  HOSPITALITY_SUPPLY: LuBuilding2,
  OTHER: LuPackage,
};

function formatCategory(value: string | null) {
  if (!value) return "Uncategorized";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStockStatus(qty: number) {
  if (qty <= 0) return { label: "Out of Stock", color: "border-rose-500/30 bg-rose-500/10 text-rose-300", icon: LuCircleX };
  if (qty <= 25) return { label: "Low Stock", color: "border-amber-500/30 bg-amber-500/10 text-amber-300", icon: LuTriangleAlert };
  return { label: "In Stock", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", icon: LuCircleCheck };
}

export function SupplierCatalog({ products, supplierId }: { products: SupplierProduct[]; supplierId?: string }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900">
          <LuPackage className="h-6 w-6 text-neutral-500" />
        </div>
        <p className="mt-4 text-sm font-medium text-neutral-400">No products listed yet</p>
        <p className="mt-1 text-xs text-neutral-500">This supplier hasn&apos;t added any products to their catalog</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {products.map((product) => {
        const stockStatus = getStockStatus(product.quantity);
        const StockIcon = stockStatus.icon;

        return (
          <Link
            key={product.id}
            href={supplierId ? `/suppliers/${supplierId}/product/${product.id}` : `/inventory/${product.id}`}
            className="bento-card noise-overlay flex flex-col cursor-pointer!"
          >
            {/* Image — polaroid style */}
            <div className="w-full aspect-square border-b border-(--clr-border) relative p-4 bg-(--clr-surface2)">
              {product.imageLink ? (
                <img
                  src={product.imageLink}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-(--clr-surface) flex items-center justify-center">
                  {(() => {
                    const Icon = CATEGORY_ICONS[product.category ?? "OTHER"] ?? LuPackage;
                    return <Icon className="h-10 w-10 text-(--clr-fg-dim)" />;
                  })()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col gap-3 flex-1" style={{ backgroundColor: "var(--clr-surface2)" }}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {product.category && (
                  <span className="rounded-full border border-(--clr-border) bg-(--clr-surface2) px-2.5 py-1 text-(--clr-fg-muted)">
                    {formatCategory(product.category)}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stockStatus.color}`}>
                  <StockIcon className="h-3.5 w-3.5" />
                  {stockStatus.label}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-(--clr-fg) leading-snug line-clamp-2 flex-1">
                {product.name}
              </h3>

              <div className="flex items-end justify-between gap-3 pt-2 border-t border-(--clr-border)">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-(--clr-fg-muted)">Price</p>
                  <p className="mt-0.5 text-sm font-bold text-(--clr-fg)">{CURRENCY.format(product.sellingPrice)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-widest text-(--clr-fg-muted)">Stock</p>
                  <p className="mt-0.5 text-sm font-semibold text-(--clr-fg)">
                    {product.quantity} <span className="text-[10px] font-normal text-(--clr-fg-muted)">{product.unit}</span>
                  </p>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
