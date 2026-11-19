// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Price, ProductBadge, ProductMedia, WishlistItem } from "./types";

// What a product card shows: a listing, similar products, a CMS rail or the wishlist hand it over.
export type ProductCardData = {
  sku: string;
  name: string;
  url_key: string;
  price: Price | null;
  media: ProductMedia;
  on_stock?: boolean;
  description?: string | null;
  product_type?: string;
  badges?: ProductBadge[] | null;
  percent_off?: string | number | null;
};

export type QuickAddItem = {
  sku: string;
  name: string;
  url_key: string;
  price: Price;
  media: ProductMedia;
};

export type QuickAddState = "idle" | "busy" | "added" | "none";

// The core's answer for one card.
export type ProductCardState = {
  // Sold out by the read model; only an explicit `false` counts, items without the field stay neutral.
  sold_out: boolean;
  // The first picture's URI (a placeholder when the product has none).
  image: string;
  // "Last piece" when the real-time stock holds one, else empty.
  single_piece: string;
  // The "+" quick add: the product can go into the cart from the card (the click still asks the stock).
  quick_add: QuickAddItem | null;
  wishlist_item: WishlistItem;
};
