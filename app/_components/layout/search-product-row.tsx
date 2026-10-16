// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { ProductThumb } from "@/components/ui/product-thumb";

import { LinkDynamic } from "@/lib/link-dynamic";
import {
  image_placeholder,
  resolve_media_uri,
} from "@/utils/NORMALIZERS/media.normalizer";
import { OmnibusNote } from "@/lib/omnibus/omnibus-note.client";
import type { Price } from "@/utils/NORMALIZERS/price.normalizer";
import { price_lines } from "@/lib/i18n/price-lines";
import { useI18n } from "@/providers/i18n.provider";
import { VARIANT_PARAM } from "@/app/[customer_country]/(product)/product/[product_url_key]/_components/variant-selection";

// --- Local normalization (search results are a "lite" shape; see search-feature.md) ---

// `main_image` arrives as a stringified JSON media object (or null). Parse it
// defensively and pick a small thumbnail from its source_set.
function resolve_image(main_image: unknown): string {
  if (typeof main_image !== "string" || !main_image) return image_placeholder;
  try {
    const media = JSON.parse(main_image) as {
      source_set?: { width?: number; source?: string }[];
    };
    const set = media?.source_set ?? [];
    if (!set.length) return image_placeholder;
    // Prefer a ~320px thumb, else the first available source.
    const pick = set.find((s) => s.width === 320) ?? set[0];
    return resolve_media_uri(pick?.source);
  } catch {
    return image_placeholder;
  }
}

// Prices are flat numbers with no currency on the item: the active currency is passed in.
// Range prices (CONFIGURABLE) use their own field names here — `range_from`,
// `special_price_range_from` — not the products/ ones; same rules as NORM_PRICE_DATA.
function to_price(
  product: {
    gross?: number | string | null;
    final_gross?: number | string | null;
    has_special_price?: boolean;
    is_range?: boolean;
    range_from?: number | string | null;
    special_price_range_from?: number | string | null;
  },
  currency: string,
): Price | null {
  const amount = (v: number | string | null | undefined) =>
    v === null || v === undefined || v === "" ? null : String(v);
  if (product.is_range) {
    const from = amount(product.range_from);
    if (!from) return null;
    const special_from = amount(product.special_price_range_from);
    return { gross: from, currency, from: true, ...(special_from ? { final_gross: special_from } : {}) };
  }
  const gross = amount(product.gross);
  if (!gross) return null;
  const special = product.has_special_price ? amount(product.final_gross) : null;
  return { gross, currency, ...(special ? { final_gross: special } : {}) };
}

// A variant has no page of its own: link to its parent's page with the variant chosen.
function product_href(product: { sku?: string; url_key?: string | null; parent_url_key?: string | null }): string {
  if (product.url_key) return `/product/${product.url_key}`;
  if (!product.parent_url_key) return "#";
  const variant = product.sku ? `?${VARIANT_PARAM}=${encodeURIComponent(product.sku)}` : "";
  return `/product/${product.parent_url_key}${variant}`;
}

export type SearchProduct = {
  sku?: string;
  name?: string;
  url_key?: string | null;
  // Set on a variant of a configurable product (its own url_key is null).
  parent_url_key?: string | null;
  main_image?: unknown;
  gross?: number | string | null;
  final_gross?: number | string | null;
  has_special_price?: boolean;
  is_range?: boolean;
  range_from?: number | string | null;
  special_price_range_from?: number | string | null;
  on_stock?: boolean;
};

export function SearchProductRow({
  product,
  currency,
  onNavigate,
}: {
  product: SearchProduct;
  currency: string;
  onNavigate: () => void;
}) {
  const src = resolve_image(product.main_image);
  const i18n = useI18n();
  const [base, special] = price_lines(i18n, to_price(product, currency));

  return (
    <LinkDynamic
      href={product_href(product)}
      onClick={onNavigate}
      data-product-tile
      data-stock={product.on_stock === false ? "out" : "in"}
      className="grid grid-cols-[5rem_1fr] gap-3 rounded-md border border-border p-2 transition-colors hover:bg-accent"
    >
      <ProductThumb
        src={src}
        alt={product.name ?? i18n.t("search.product_fallback")}
        sizes="80px"
        className="w-20 unavailable:opacity-60 unavailable:grayscale"
      />
      <div className="min-w-0 self-center unavailable:opacity-70">
        <h4 className="truncate text-sm">{product.name}</h4>
        <div className="mt-0.5 flex items-center gap-1.5">
          {special ? (
            <>
              <span className="text-[10px] text-muted-foreground line-through">
                {base}
              </span>
              <span className="text-xs font-semibold text-destructive">
                {special}
              </span>
            </>
          ) : (
            <span className="text-xs font-semibold">{base}</span>
          )}
        </div>
        {special && product.sku && <OmnibusNote sku={product.sku} compact />}
        {product.on_stock === false && (
          <span data-sold-out-label className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {i18n.t("product.out_of_stock")}
          </span>
        )}
      </div>
    </LinkDynamic>
  );
}
