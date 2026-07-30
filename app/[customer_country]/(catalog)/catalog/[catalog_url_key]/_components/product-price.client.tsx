"use client";

import type { Price } from "@/utils/NORMALIZERS/price.normalizer";

export function ProductPrice({
  price,
  compact = false,
}: {
  price: Price;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {price.map((p, i) => (
        <span
          key={i}
          className={
            i
              ? compact
                ? "text-xs font-semibold text-destructive"
                : "text-sm font-semibold text-destructive"
              : price.length > 1
                ? compact
                  ? "text-[10px] text-muted-foreground line-through"
                  : "text-xs text-muted-foreground line-through"
                : compact
                  ? "text-xs font-semibold"
                  : "text-sm font-semibold"
          }
        >
          {p}
        </span>
      ))}
    </div>
  );
}
