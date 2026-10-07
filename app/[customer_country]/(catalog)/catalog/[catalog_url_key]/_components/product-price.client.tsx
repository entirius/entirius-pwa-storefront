// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { Price } from "@/utils/NORMALIZERS/price.normalizer";
import { OmnibusNote } from "@/lib/omnibus/omnibus-note.client";

// A reduced price (two entries) carries the Omnibus line when the SKU is known.
export function ProductPrice({
  price,
  sku,
  compact = false,
  large = false,
}: {
  price: Price;
  sku?: string;
  compact?: boolean;
  // The product page's headline price.
  large?: boolean;
}) {
  return (
    <div>
      <div className={compact ? "flex items-center gap-1.5" : "flex flex-wrap items-baseline gap-x-2"}>
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
                    : large
                      ? "text-base text-muted-foreground line-through"
                      : "text-xs text-muted-foreground line-through"
                  : compact
                    ? "text-xs font-semibold"
                    : large
                      ? "font-brand text-3xl text-heading"
                      : "font-brand text-lg text-heading"
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
