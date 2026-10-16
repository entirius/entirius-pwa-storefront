// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { MediaImage } from "@/components/ui/media-image.client";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { LinkDynamic } from "@/lib/link-dynamic";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { ProductPrice } from "./product-price.client";
import { ProductBadges } from "./product-badges";
import { QuickAdd } from "./quick-add.client";
import { useI18n } from "@/providers/i18n.provider";
import { useSinglePiece } from "./use-single-piece";

const PLACEHOLDER_MEDIA = [{ uri: image_placeholder, width: 600, height: 600 }];

// The description is HTML (the product page sanitizes and renders it); the tile shows it as plain text.
const plain_text = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function ProductTile({
  product,
  variant = "default",
}: {
  product: any;
  variant?: "default" | "compact";
}) {
  const { t } = useI18n();
  // Only an explicit `false` counts as sold out: items without the field (wishlist) stay neutral.
  const sold_out = product?.on_stock === false;
  const media = product?.media?.[0] ?? PLACEHOLDER_MEDIA;
  const firstMedia = Array.isArray(media) ? media[0] : media;
  const compact = variant === "compact";
  const single_piece = useSinglePiece(product?.sku, !compact && !sold_out);

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
      className={compact ? "absolute top-2 right-2" : "absolute top-2 right-2 z-raised"}
      variant={compact ? "ghost" : "secondary"}
      size={compact ? "icon-xs" : "icon-sm"}
      onClick={(e) => e.preventDefault()}
    />
  );

  if (compact) {
    return (
      <LinkDynamic
        href={`/product/${product.url_key}`}
        data-product-tile
        data-stock={sold_out ? "out" : "in"}
        data-available={sold_out ? "false" : "true"}
        className="grid grid-cols-[5rem_1fr] gap-3 rounded-xl bg-card bg-gradient-card p-2 group relative"
      >
        <div className="relative w-20 aspect-product self-start rounded-md bg-muted overflow-hidden">
          <MediaImage
            src={firstMedia.uri}
            alt={product.name}
            fill
            sizes="80px"
            className="object-cover unavailable:opacity-60 unavailable:grayscale"
          />
        </div>
        <div className="min-w-0 self-center unavailable:opacity-70">
          <h3 className="text-sm truncate">{product.name}</h3>
          <div className="mt-0.5">
            <ProductPrice price={product.price} sku={product.sku} compact />
          </div>
        </div>
        {sold_out && (
          <span
            data-sold-out-label
            className="absolute bottom-2 right-2 z-raised rounded-sm bg-background/90 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground"
          >
            {t("product.out_of_stock")}
          </span>
        )}
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
      data-product-tile
      data-stock={sold_out ? "out" : "in"}
      data-available={sold_out ? "false" : "true"}
      data-single-piece={single_piece ? "" : undefined}
      className="flex h-full flex-col gap-3 rounded-3xl bg-card bg-gradient-card p-3 group relative transition-shadow hover:shadow-glow"
    >
      <div className="relative w-full aspect-product rounded-2xl bg-muted overflow-hidden">
        {wishlist}
        <MediaImage
          src={firstMedia.uri}
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
            {t("product.out_of_stock")}
          </span>
        )}
        <ProductBadges
          badges={product.badges}
          percent_off={product.percent_off}
          className="absolute top-2.5 left-2.5 right-12"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1 px-1 unavailable:opacity-70">
        <h3 className="text-base leading-snug line-clamp-2 text-heading">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{plain_text(product.description)}</p>
        )}
        {single_piece && <p className="text-xs font-medium text-heading">{single_piece}</p>}
      </div>
      <div className="flex items-end justify-between gap-2 px-1 pb-1 unavailable:opacity-70">
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
