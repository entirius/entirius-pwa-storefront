// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { ProductThumb } from "@/components/ui/product-thumb";
import { LinkDynamic } from "@/lib/link-dynamic";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import type { Product } from "@/utils/NORMALIZERS/product.normalizer";
import { ProductPrice } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/product-price.client";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { VARIANT_PARAM } from "@/app/[customer_country]/(product)/product/[product_url_key]/_components/variant-selection";

// A small picture of the product's first image: the ~320px source, else the first one.
export function thumb_src(media: Product["media"]): string {
  const set = media[0] ?? [];
  return (set.find((m) => m.width === 320) ?? set[0])?.uri ?? image_placeholder;
}

// A variant has no page of its own: link to its parent's page with the variant chosen.
export function product_href(product: Pick<Product, "sku" | "url_key" | "parent_url_key">): string {
  if (product.url_key) return `/product/${product.url_key}`;
  if (!product.parent_url_key) return "#";
  const variant = product.sku ? `?${VARIANT_PARAM}=${encodeURIComponent(product.sku)}` : "";
  return `/product/${product.parent_url_key}${variant}`;
}

export function SearchProductRow({ product, onNavigate }: { product: Product; onNavigate: () => void }) {
  const i18n = useI18n();

  return (
    <LinkDynamic
      href={product_href(product)}
      onClick={onNavigate}
      data-product-tile
      data-stock={product.on_stock === false ? "out" : "in"}
      className="grid grid-cols-[5rem_1fr] gap-3 rounded-md border border-border p-2 transition-colors hover:bg-accent"
    >
      <ProductThumb
        src={thumb_src(product.media)}
        alt={product.name || i18n.t("search.product_fallback")}
        sizes="80px"
        className="w-20 unavailable:opacity-60 unavailable:grayscale"
      />
      <div className="min-w-0 self-center unavailable:opacity-70">
        <h4 className="truncate text-sm">{product.name}</h4>
        <div className="mt-0.5">
          <ProductPrice price={product.price} sku={product.sku} compact />
        </div>
        {product.on_stock === false && (
          <span data-sold-out-label className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {i18n.t("product.sold_out")}
          </span>
        )}
      </div>
    </LinkDynamic>
  );
}
