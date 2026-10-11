"use client";

import type { Price } from "@/utils/NORMALIZERS/price.normalizer";
import { useI18n } from "@/providers/i18n.provider";

export function ProductPrice({
  price,
  compact = false,
}: {
  price: Price | null;
  compact?: boolean;
}) {
  const i18n = useI18n();
  // [list price] or, when a special price applies, [struck list price, special price].
  const amounts = price?.final_gross ? [price.gross, price.final_gross] : [price?.gross];

  return (
    <div className="flex items-center gap-1.5">
      {amounts.map((amount, i) => (
        <span
          key={i}
          className={
            i
              ? compact
                ? "text-xs font-semibold text-destructive"
                : "text-sm font-semibold text-destructive"
              : amounts.length > 1
                ? compact
                  ? "text-[10px] text-muted-foreground line-through"
                  : "text-xs text-muted-foreground line-through"
                : compact
                  ? "text-xs font-semibold"
                  : "text-sm font-semibold"
          }
        >
          {i18n.price(amount, price?.currency)}
        </span>
      ))}
    </div>
  );
}
