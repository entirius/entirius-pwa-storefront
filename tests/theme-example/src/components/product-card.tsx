// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ReactNode } from "react";
import { Media } from "@entirius/storefront-sdk/components/media";
import { Link } from "@entirius/storefront-sdk/components/link";
import type { ProductCardData } from "@entirius/storefront-sdk/product/card";
import { useProductCard } from "@entirius/storefront-sdk/storefront";
import { ProductPrice } from "@theme/components/product-price";
import { QuickAdd } from "@theme/components/quick-add";
import { WishlistButton } from "@theme/components/wishlist-button";

// The test theme's product card: the name over a square picture, the price and the quick add in one row. It keeps
// the default card's exports, so the listing, similar products, CMS rails and the wishlist all take it.
export function ProductCard({
  product,
  variant = "default",
  action,
}: {
  product: ProductCardData;
  variant?: "default" | "compact";
  action?: ReactNode;
}) {
  const { sold_out, image, quick_add, wishlist_item } = useProductCard(product, variant === "compact");

  return (
    <Link
      href={`/product/${product.url_key}`}
      data-product-tile
      data-theme-example-card
      data-stock={sold_out ? "out" : "in"}
      className="flex flex-col gap-2 rounded-md border border-border bg-background p-2"
    >
      <h3 className="text-sm font-medium text-heading">{product.name}</h3>
      <div data-theme-example-picture className="relative aspect-square overflow-hidden rounded-sm bg-muted">
        <Media src={image} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
        <WishlistButton
          sku={product.sku}
          item={wishlist_item}
          className="absolute top-1 right-1"
          variant="secondary"
          size="icon-sm"
          onClick={(e) => e.preventDefault()}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <ProductPrice price={product.price} sku={product.sku} compact />
        {quick_add && <QuickAdd item={quick_add} />}
      </div>
      {action}
    </Link>
  );
}
