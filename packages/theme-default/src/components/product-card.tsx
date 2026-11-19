// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Media } from "@entirius/storefront-sdk/components/media";
import { Link } from "@entirius/storefront-sdk/components/link";
import type { ProductCardData } from "@entirius/storefront-sdk/product/card";
import { useProductCard } from "@entirius/storefront-sdk/storefront";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { WishlistButton } from "@theme/components/wishlist-button";
import { ProductPrice } from "@theme/components/product-price";
import { ProductBadges } from "@theme/components/product-badges";
import { QuickAdd } from "@theme/components/quick-add";

const plain_text = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function ProductCard({
  product,
  variant = "default",
  action,
}: {
  product: ProductCardData;
  variant?: "default" | "compact";
  // Compact only: a control under the price (the wishlist's "Move to cart").
  action?: React.ReactNode;
}) {
  const { t } = useI18n();
  const compact = variant === "compact";
  const { sold_out, image, single_piece, quick_add, wishlist_item } = useProductCard(product, compact);

  const wishlist = (
    <WishlistButton
      sku={product.sku}
      item={wishlist_item}
      className={compact ? "absolute top-2 right-2" : "absolute top-2 right-2 z-raised"}
      variant={compact ? "ghost" : "secondary"}
      size={compact ? "icon-xs" : "icon-sm"}
      onClick={(e) => e.preventDefault()}
    />
  );

  if (compact) {
    return (
      <Link
        href={`/product/${product.url_key}`}
        data-product-tile
        data-stock={sold_out ? "out" : "in"}
        className="grid grid-cols-[5rem_1fr] gap-3 rounded-xl bg-card bg-gradient-card p-2 group relative"
      >
        <div className="relative w-20 aspect-product self-start rounded-md bg-muted overflow-hidden">
          <Media
            src={image}
            alt={product.name}
            fill
            sizes="80px"
            className="object-cover unavailable:opacity-60 unavailable:grayscale"
          />
        </div>
        <div data-product-tile-body className="min-w-0 self-center unavailable:opacity-70">
          <h3 className="text-sm truncate">{product.name}</h3>
          <div className="mt-0.5">
            <ProductPrice price={product.price} sku={product.sku} compact />
          </div>
          {action && <div className="mt-2">{action}</div>}
        </div>
        {sold_out && (
          <span
            data-sold-out-label
            className="absolute bottom-2 right-2 z-raised rounded-sm bg-background/90 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground"
          >
            {t("product.sold_out")}
          </span>
        )}
        {wishlist}
      </Link>
    );
  }

  return (
    <Link
      href={`/product/${product.url_key}`}
      data-product-tile
      data-stock={sold_out ? "out" : "in"}
      data-single-piece={single_piece ? "" : undefined}
      className="flex h-full flex-col gap-3 rounded-3xl bg-card bg-gradient-card p-3 group relative transition-shadow hover:shadow-glow"
    >
      <div className="relative w-full aspect-product rounded-2xl bg-muted overflow-hidden">
        {wishlist}
        <Media
          src={image}
          alt={product.name}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300 unavailable:opacity-60 unavailable:grayscale"
        />
        {sold_out && (
          <span
            data-sold-out-label
            className="absolute bottom-2.5 left-2.5 z-raised rounded-sm bg-background/90 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground"
          >
            {t("product.sold_out")}
          </span>
        )}
        <ProductBadges
          badges={product.badges}
          percent_off={product.percent_off}
          className="absolute top-2.5 left-2.5 right-12"
        />
      </div>

      <div data-product-tile-body className="flex flex-1 flex-col gap-1 px-1 unavailable:opacity-70">
        <h3 className="text-base leading-snug line-clamp-2 text-heading">{product.name}</h3>
        {product.description && (
          <p data-product-tile-description className="text-xs text-muted-foreground line-clamp-2">{plain_text(product.description)}</p>
        )}
        {single_piece && <p className="text-xs font-medium text-heading">{single_piece}</p>}
      </div>
      <div data-product-tile-footer className="flex items-end justify-between gap-2 px-1 pb-1 unavailable:opacity-70">
        <ProductPrice price={product.price} sku={product.sku} />
        {quick_add && <QuickAdd item={quick_add} />}
      </div>
    </Link>
  );
}
