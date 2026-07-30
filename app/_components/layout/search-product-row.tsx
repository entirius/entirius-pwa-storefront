"use client";

import Image from "next/image";

import { LinkDynamic } from "@/lib/link-dynamic";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";

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
    return pick?.source ?? image_placeholder;
  } catch {
    return image_placeholder;
  }
}

// Prices are flat numbers with no currency on the item. Build a display pair:
// [base] or [base, special] when discounted.
function format_price(
  product: {
    gross?: number | string | null;
    final_gross?: number | string | null;
    has_special_price?: boolean;
  },
  currency: string,
): { base: string | null; special: string | null } {
  const fmt = (v: number | string | null | undefined) =>
    v === null || v === undefined || v === "" ? null : `${v} ${currency}`.trim();
  const base = fmt(product.gross);
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
        <Image
          src={src}
          alt={product.name ?? "Product"}
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
                {base}
              </span>
              <span className="text-xs font-semibold text-destructive">
                {special}
              </span>
            </>
          ) : (
            <span className="text-xs font-semibold">{base ?? "—"}</span>
          )}
        </div>
      </div>
    </LinkDynamic>
  );
}
