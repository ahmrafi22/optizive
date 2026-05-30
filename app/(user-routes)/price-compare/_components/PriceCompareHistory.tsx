"use client";

import { LuClock, LuHistory, LuLoader, LuX } from "react-icons/lu";

interface HistoryItem {
  id: string;
  productName: string;
  category: string;
  country: string;
  createdAt: string;
}

interface PriceCompareHistoryProps {
  open: boolean;
  onClose: () => void;
  items: HistoryItem[];
  loading: boolean;
  onSelect: (id: string) => void;
}

export function PriceCompareHistory({
  open,
  onClose,
  items,
  loading,
  onSelect,
}: PriceCompareHistoryProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      )}

      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] border-l border-(--clr-border) bg-(--clr-surface) shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--clr-border)">
          <div className="flex items-center gap-2 text-sm font-semibold text-(--clr-fg)">
            <LuHistory className="h-4 w-4" />
            Saved Comparisons
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-(--clr-surface2) text-(--clr-fg-muted) hover:text-(--clr-fg) transition-colors"
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-57px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LuLoader className="h-5 w-5 animate-spin text-(--clr-fg-muted)" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 px-6 text-center text-sm text-(--clr-fg-muted)">
              <LuClock className="h-8 w-8 opacity-40" />
              No saved comparisons yet
            </div>
          ) : (
            <div className="py-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className="w-full text-left px-5 py-3.5 hover:bg-(--clr-surface2) transition-colors border-b border-(--clr-border) last:border-b-0"
                >
                  <div className="text-sm font-medium text-(--clr-fg) truncate">
                    {item.productName}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] uppercase tracking-wider text-(--clr-fg-muted) bg-(--clr-surface2) px-1.5 py-0.5 rounded-md">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-(--clr-fg-dim)">
                      {item.country}
                    </span>
                  </div>
                  <div className="text-[11px] text-(--clr-fg-dim) mt-1.5">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
