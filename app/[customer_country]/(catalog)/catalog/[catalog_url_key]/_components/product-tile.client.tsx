// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { MediaImage } from "@/components/ui/media-image.client";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { LinkDynamic } from "@/lib/link-dynamic";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { ProductPrice } from "./product-price.client";
import { ProductBadges } from "./product-badges";
import { QuickAdd } from "./quick-add.client";

const PLACEHOLDER_MEDIA = [{ uri: image_placeholder, width: 600, height: 600 }];

export function ProductTile({
  product,
  variant = "default",
}: {
  product: any;
  variant?: "default" | "compact";
}) {
  const media = product?.media?.[0] ?? PLACEHOLDER_MEDIA;
  const firstMedia = Array.isArray(media) ? media[0] : media;
  const compact = variant === "compact";

  const wishlistItem = {
    sku: product.sku,
    name: product.name,
    url_key: product.url_key,
    price: product.price,
    description: product.description ?? "",
    media: Array.isArray(media) ? [media] : [[media]],
  };

  const wishlist = (
    <WishlistButton
      sku={product.sku}
      item={wishlistItem}
      className={compact ? "absolute top-2 right-2" : "absolute top-2 right-2 z-10"}
      variant={compact ? "ghost" : "secondary"}
      size={compact ? "icon-xs" : "icon-sm"}
      onClick={(e) => e.preventDefault()}
    />
  );

  if (compact) {
    return (
      <LinkDynamic
        href={`/product/${product.url_key}`}
        className="grid grid-cols-[5rem_1fr] gap-3 rounded-xl bg-card bg-gradient-card p-2 group relative"
      >
        <div className="size-20 rounded-md bg-muted overflow-hidden">
          <MediaImage
            src={firstMedia.uri}
            alt={product.name}
            width={80}
            height={80}
            className="object-cover size-full"
          />
        </div>
        <div className="min-w-0 self-center">
          <h3 className="text-sm truncate">{product.name}</h3>
          <div className="mt-0.5">
            <ProductPrice price={product.price} sku={product.sku} compact />
          </div>
        </div>
        {wishlist}
      </LinkDynamic>
    );
  }

  // In stock and with a price: the "+" quick add. Out of stock or price on request
  // leaves only the link to the product page.
  const can_quick_add = product.purchasable && product.on_stock !== false;

  return (
    <LinkDynamic
      href={`/product/${product.url_key}`}
      className="flex h-full flex-col gap-3 rounded-3xl bg-card bg-gradient-card p-3 group relative transition-shadow hover:shadow-glow"
    >
      <AspectRatio ratio={1 / 1} className="w-full rounded-2xl bg-muted overflow-hidden relative">
        {wishlist}
        <MediaImage
          src={firstMedia.uri}
          alt={product.name}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <ProductBadges
          badges={product.badges}
          percent_off={product.percent_off}
          className="absolute top-2.5 left-2.5 right-12"
        />
      </AspectRatio>

      <div className="flex flex-1 flex-col gap-1 px-1">
        <h3 className="text-base leading-snug line-clamp-2 text-heading">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
        )}
      </div>
      <div className="flex items-end justify-between gap-2 px-1 pb-1">
        <ProductPrice price={product.price} sku={product.sku} />
        {can_quick_add && (
          <QuickAdd
            item={{
              sku: product.sku,
              name: product.name,
              url_key: product.url_key,
              price: product.price,
              media: Array.isArray(media) ? [media] : [[media]],
            }}
          />
        )}
      </div>
    </LinkDynamic>
  );
}
