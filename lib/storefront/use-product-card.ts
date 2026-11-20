// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ProductCardData, ProductCardState } from "@entirius/storefront-sdk/product/card";
import type { MediaSource } from "@entirius/storefront-sdk/product";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { buy_block } from "@/lib/buy-rules";
import { useSinglePiece } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/use-single-piece";

const PLACEHOLDER_MEDIA: MediaSource[] = [{ uri: image_placeholder, width: 600, height: 600 }];

export function useProductCard(product: ProductCardData, compact: boolean): ProductCardState {
  // Only an explicit `false` counts as sold out: items without the field (wishlist) stay neutral.
  const sold_out = product?.on_stock === false;
  const single_piece = useSinglePiece(product?.sku, !compact && !sold_out);
  // Items stored before the media shape was fixed may hold one picture instead of its sizes.
  const first: MediaSource[] | MediaSource = product?.media?.[0] ?? PLACEHOLDER_MEDIA;
  const picture = Array.isArray(first) ? first : [first];
  // The "+" quick add when the rules of the type let it (the click asks the real-time stock). Sold out by the
  // read model, a variant to choose or no price leaves only the link to the product page.
  const can_quick_add =
    !compact &&
    buy_block(product.product_type, { quantity: sold_out ? 0 : undefined, price: product.price }) === null;

  return {
    sold_out,
    image: picture[0].uri,
    single_piece,
    quick_add:
      can_quick_add && product.price
        ? { sku: product.sku, name: product.name, url_key: product.url_key, price: product.price, media: [picture] }
        : null,
    wishlist_item: {
      sku: product.sku,
      name: product.name,
      url_key: product.url_key,
      price: product.price,
      product_type: product.product_type,
      description: product.description ?? "",
      media: [picture],
    },
  };
}
