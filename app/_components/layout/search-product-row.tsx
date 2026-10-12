"use client";

import Image from "next/image";

import { LinkDynamic } from "@/lib/link-dynamic";
import { resolve_media_url } from "@/utils/media-url";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { useI18n } from "@/providers/i18n.provider";
import { VARIANT_PARAM } from "@/app/[customer_country]/(product)/product/[product_url_key]/_components/variant-selection";

// A variant has no page of its own: link to its parent's page with the variant chosen.
function product_href(product: { sku?: string; url_key?: string | null; parent_url_key?: string | null }): string {
  if (product.url_key) return `/product/${product.url_key}`;
  if (!product.parent_url_key) return "#";
  const variant = product.sku ? `?${VARIANT_PARAM}=${encodeURIComponent(product.sku)}` : "";
  return `/product/${product.parent_url_key}${variant}`;
}

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
    return pick?.source ? resolve_media_url(pick.source) : image_placeholder;
  } catch {
    return image_placeholder;
  }
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
  const { t, price } = useI18n();
  const src = resolve_image(product.main_image);
  // Prices are flat numbers with no currency on the item: the active currency is passed in.
  const special =
    product.has_special_price && product.final_gross != null
      ? price(product.final_gross, currency)
      : null;

  return (
    <LinkDynamic
      href={product_href(product)}
      onClick={onNavigate}
      className="grid grid-cols-[5rem_1fr] gap-3 rounded-md border border-border p-2 transition-colors hover:bg-accent"
    >
      <div className="size-20 overflow-hidden rounded-md bg-muted">
        <Image
          src={src}
          alt={product.name ?? t("search.product_fallback")}
          width={80}
          height={80}
          className="size-full object-cover grayscale dark:brightness-20"
        />
      </div>
      <div className="min-w-0 self-center">
        <h4 className="truncate text-sm font-semibold">{product.name}</h4>
        <div className="mt-0.5 flex items-center gap-1.5">
          {special ? (
            <>
              <span className="text-[10px] text-muted-foreground line-through">
                {price(product.gross, currency)}
              </span>
              <span className="text-xs font-semibold text-destructive">
                {special}
              </span>
            </>
          ) : (
            <span className="text-xs font-semibold">{price(product.gross, currency)}</span>
          )}
        </div>
      </div>
    </LinkDynamic>
  );
}
