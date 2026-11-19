// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { createContext, useContext, type ReactNode, type RefObject } from "react";
import type { Price, ProductBadge, ProductMedia, SpecGroup, Story, VariantAxis, WishlistItem } from "./types";

// Everything the product page shows and can do, worked out by the core (product, variants, real-time stock, buy
// rules). Each part of the page template reads what it needs from here, so a theme can move, drop or replace a part
// without passing data around.
export type ProductPageModel = {
  product: {
    sku: string;
    name: string;
    url_key: string;
    brands: string[];
    badges: ProductBadge[] | null;
    percent_off: string | number | null;
    // The configured key attributes in one line, empty when none.
    key_facts: string;
    // null when the description has no text.
    description_html: string | null;
    specs: SpecGroup[];
    stories: Story[];
  };
  // The chosen variant's pictures, else the product's, else the placeholder.
  media: ProductMedia;
  price: {
    value: Price | null;
    // "from <price>": no variant chosen and the variants are not all priced the same.
    from: boolean;
    // The SKU whose lowest 30-day price may be shown; null for a configurable product.
    omnibus_sku: string | null;
  };
  // Sold online: only the stock or the variant choice can stop it (not an enquiry-only or unpriced product).
  purchasable: boolean;
  stock: {
    // The real-time stock has answered; until then nothing is claimed.
    known: boolean;
    in_stock: boolean;
    // Show the in-stock / out-of-stock line.
    show_status: boolean;
    // Sold out for good: nothing to buy and the stock has answered.
    sold_out: boolean;
    // Where similar products go: under the buy area when sold, at the bottom otherwise.
    sold: boolean;
  };
  // A configurable product's choice; null for other types.
  variants: {
    axes: VariantAxis[];
    selection: Record<string, string>;
    choose: (axis: string, value: string) => void;
    is_available: (axis: string, value: string) => boolean;
    // Back-in-stock alerts are on: a sold-out option can be chosen (to ask for it) and keeps its sold-out look.
    sold_out_selectable: boolean;
  } | null;
  buy: {
    // "buy": quantity and the add button; "stock_alert": the back-in-stock form (blocks.stock_alert);
    // "choose_option": every variant is sold out and none is chosen, so the alert asks for a choice first.
    mode: "buy" | "stock_alert" | "choose_option";
    can_buy: boolean;
    label: string;
    // A single piece cannot be bought twice: no quantity stepper then.
    single_piece: boolean;
    quantity: number;
    set_quantity: (quantity: number) => void;
    max: number;
    add_to_cart: () => void;
  };
  wishlist_item: WishlistItem;
  // "Tell me about a similar product" for a product sold out for good.
  notify_similar: { visible: boolean; open: () => void };
  // A filter link for a spec value ("/catalog/chairs?q_color=red"), null when the category has no such filter.
  spec_link: (idx: string | null, value_idx: string | null) => string | null;
  // Forms the core renders whole for now: the theme places them.
  blocks: {
    enquiry: ReactNode;
    stock_alert: ReactNode;
    notify_similar: ReactNode;
  };
  // Similar products, streamed from the server; renders nothing when there are none.
  related: ReactNode;
  // The element with the buy controls: the sticky phone bar watches it and actions scroll to it.
  buy_area: RefObject<HTMLDivElement | null>;
  scroll_to_buy_area: () => void;
};

const ProductPageContext = createContext<ProductPageModel | null>(null);

export function ProductPageProvider({ value, children }: { value: ProductPageModel; children: ReactNode }) {
  return <ProductPageContext value={value}>{children}</ProductPageContext>;
}

export function useProductPage(): ProductPageModel {
  const page = useContext(ProductPageContext);
  if (!page) throw new Error("useProductPage must be used within <ProductPageProvider>");
  return page;
}
