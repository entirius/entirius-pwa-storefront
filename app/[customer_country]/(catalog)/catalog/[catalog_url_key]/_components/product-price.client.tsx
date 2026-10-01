"use client";

import type { Price } from "@/utils/NORMALIZERS/price.normalizer";
import { OmnibusNote } from "@/lib/omnibus/omnibus-note.client";

// A reduced price (two entries) carries the Omnibus line when the SKU is known.
export function ProductPrice({
  price,
  sku,
  compact = false,
}: {
  price: Price;
  sku?: string;
  compact?: boolean;
}) {
  return (
    <div>
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
      {sku && price.length > 1 && <OmnibusNote sku={sku} compact={compact} />}
    </div>
  );
}
