// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { MediaImage } from "@/components/ui/media-image.client";

import { LinkDynamic } from "@/lib/link-dynamic";
import {
  image_placeholder,
  resolve_media_uri,
} from "@/utils/NORMALIZERS/media.normalizer";
import { OmnibusNote } from "@/lib/omnibus/omnibus-note.client";
import { PRICE_ON_REQUEST } from "@/utils/NORMALIZERS/price.normalizer";

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

// Prices are flat numbers with no currency on the item. Build a display pair:
// [base] or [base, special] when discounted. Range prices (CONFIGURABLE) use
// their own field names here — `range_from`, `special_price_range_from` — not
// the products/ ones; see NORM_PRICE_DATA for the same rules.
function format_price(
  product: {
    gross?: number | string | null;
    final_gross?: number | string | null;
    has_special_price?: boolean;
    is_range?: boolean;
    range_from?: number | string | null;
    special_price_range_from?: number | string | null;
  },
  currency: string,
): { base: string | null; special: string | null } {
  const fmt = (v: number | string | null | undefined) =>
    v === null || v === undefined || v === "" ? null : `${v} ${currency}`.trim();
  if (product.is_range) {
    const from = fmt(product.range_from);
    const special_from = fmt(product.special_price_range_from);
    return {
      base: from ? `From ${from}` : PRICE_ON_REQUEST,
      special: special_from ? `From ${special_from}` : null,
    };
  }
  const base = fmt(product.gross) ?? PRICE_ON_REQUEST;
  const special =
    product.has_special_price && product.final_gross != null
      ? fmt(product.final_gross)
      : null;
  return { base, special };
}

export type SearchProduct = {
  sku?: string;
  name?: string;
  url_key?: string;
  main_image?: unknown;
  gross?: number | string | null;
  final_gross?: number | string | null;
  has_special_price?: boolean;
  is_range?: boolean;
  range_from?: number | string | null;
  special_price_range_from?: number | string | null;
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
  const { base, special } = format_price(product, currency);

  return (
    <LinkDynamic
      href={`/product/${product.url_key}`}
      onClick={onNavigate}
      className="grid grid-cols-[5rem_1fr] gap-3 rounded-md border border-border p-2 transition-colors hover:bg-accent"
    >
      <div className="size-20 overflow-hidden rounded-md bg-muted">
        <MediaImage
          src={src}
          alt={product.name ?? "Product"}
          width={80}
          height={80}
          className="size-full object-cover"
        />
      </div>
      <div className="min-w-0 self-center">
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
      </div>
    </LinkDynamic>
  );
}
