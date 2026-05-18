import Link from "next/link";

import { formatCategory, formatCurrency } from "@/app/(user-routes)/inventory/_components/types";
import type { PublicSmartBasketListItem, SmartBasketListItem } from "@/backend/smart-basket/smart-basket";

const cardBase = "bento-card noise-overlay p-5 space-y-4";

export function SmartBasketCard({
  basket,
  showOwner = false,
  linkTo,
}: {
  basket: SmartBasketListItem | PublicSmartBasketListItem;
  showOwner?: boolean;
  linkTo?: string;
}) {
  const total = basket.customTotal ?? basket.baseTotal;
  const content = (
    <div className={cardBase}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-(--clr-fg)">{basket.title}</h3>
          {basket.description && (
            <p className="mt-1 text-sm text-(--clr-fg-muted) line-clamp-2">{basket.description}</p>
          )}
          {showOwner && "ownerName" in basket && (
            <p className="mt-2 text-xs text-(--clr-fg-muted)">
              By {basket.ownerName}
              {basket.ownerBusinessName ? ` - ${basket.ownerBusinessName}` : ""}
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            basket.isPublic
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300"
              : "border-(--clr-border) bg-(--clr-surface2) text-(--clr-fg-muted)"
          }`}
        >
          {basket.isPublic ? "Public" : "Private"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {basket.items.slice(0, 4).map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-2.5 py-1 text-xs text-(--clr-fg-muted)"
          >
            <span className="font-medium text-(--clr-fg)">{item.name}</span>
            <span className="text-[10px] uppercase tracking-wider">{formatCategory(item.category)}</span>
          </span>
        ))}
        {basket.items.length === 0 && (
          <span className="text-xs text-(--clr-fg-muted)">No products yet.</span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-(--clr-fg-muted)">Total</div>
        <div className="font-mono text-base font-bold text-(--clr-fg)">{formatCurrency(total)}</div>
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="block active:scale-[0.99] transition-transform duration-150">
        {content}
      </Link>
    );
  }

  return content;
}
