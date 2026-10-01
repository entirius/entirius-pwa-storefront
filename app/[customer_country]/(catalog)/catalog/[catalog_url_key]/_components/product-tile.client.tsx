"use client";

import { MediaImage } from "@/components/ui/media-image.client";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { LinkDynamic } from "@/lib/link-dynamic";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { ProductPrice } from "./product-price.client";
import { ProductBadges } from "./product-badges";

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

  return (
    <LinkDynamic
      href={`/product/${product.url_key}`}
      className={
        compact
          ? "grid grid-cols-[5rem_1fr] gap-3 rounded-xl bg-gradient-card p-2 group relative"
          : "flex h-full flex-col rounded-2xl bg-gradient-card group overflow-hidden relative transition-shadow hover:shadow-glow"
      }
    >
      {compact ? (
        <div className="size-20 rounded-md bg-muted overflow-hidden">
          <MediaImage
            src={firstMedia.uri}
            alt={product.name}
            width={80}
            height={80}
            className="object-cover size-full"
          />
        </div>
      ) : (
        <AspectRatio
          ratio={1 / 1}
          className="w-full bg-muted overflow-hidden relative"
        >
          <MediaImage
            src={firstMedia.uri}
            alt={product.name}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <ProductBadges
            badges={product.badges}
            percent_off={product.percent_off}
            className="absolute top-2 left-2 right-12"
          />
        </AspectRatio>
      )}

      <div className={compact ? "min-w-0 self-center" : "flex flex-col flex-1 gap-1 p-3"}>
        <h3 className={compact ? "text-sm truncate" : "text-sm line-clamp-2 leading-snug"}>
          {product.name}
        </h3>
        {!compact && product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
        )}
        <div className={compact ? "mt-0.5" : "mt-auto pt-2"}>
          <ProductPrice price={product.price} sku={product.sku} compact={compact} />
        </div>
      </div>

      <WishlistButton
        sku={product.sku}
        item={wishlistItem}
        className="absolute top-2 right-2"
        variant={compact ? "ghost" : "secondary"}
        size={compact ? "icon-xs" : "icon-sm"}
        onClick={(e) => e.preventDefault()}
      />
    </LinkDynamic>
  );
}
