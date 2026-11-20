// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { Price } from "@entirius/storefront-sdk/product";
import { price_lines } from "@entirius/storefront-sdk/i18n/price-lines";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { useOmnibus } from "@entirius/storefront-sdk/storefront";

// The lowest price of the last 30 days next to a reduced price (EU Omnibus); nothing until it is known.
function OmnibusNote({ sku, compact = false }: { sku: string; compact?: boolean }) {
  const lowest = useOmnibus(sku);
  const i18n = useI18n();
  if (!lowest) return null;
  const price = i18n.price(lowest.gross, lowest.currency);
  return (
    <p className={compact ? "text-[10px] text-muted-foreground" : "text-xs text-muted-foreground"}>
      {compact ? i18n.t("omnibus.lowest_short", { price }) : i18n.t("omnibus.lowest", { price })}
    </p>
  );
}

// A reduced price (two entries) carries the Omnibus line when the SKU is known.
export function ProductPrice({
  price,
  sku,
  compact = false,
  large = false,
}: {
  price: Price | null;
  sku?: string;
  compact?: boolean;
  // The product page's headline price.
  large?: boolean;
}) {
  const lines = price_lines(useI18n(), price);
  return (
    <div>
      <div className={compact ? "flex items-center gap-1.5" : "flex flex-wrap items-baseline gap-x-2"}>
        {lines.map((p, i) => (
          <span
            key={i}
            className={
              i
                ? compact
                  ? "text-xs font-semibold text-destructive"
                  : "text-sm font-semibold text-destructive"
                : lines.length > 1
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
      {sku && lines.length > 1 && <OmnibusNote sku={sku} compact={compact} />}
    </div>
  );
}
