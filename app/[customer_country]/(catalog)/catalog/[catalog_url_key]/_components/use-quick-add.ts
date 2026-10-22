// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { useCartStore } from "@/stores/cart.store";
import { useAddedToCart } from "@/stores/added-to-cart.store";
import type { Price } from "@/utils/NORMALIZERS/price.normalizer";
import { stock_query } from "@/app/[customer_country]/(product)/product/[product_url_key]/stock.query";

export type QuickAddItem = {
  sku: string;
  name: string;
  url_key: string;
  price: Price;
  media: { uri: string; width: number; height: number }[][];
};

export type QuickAddState = "idle" | "busy" | "added" | "none";

// One unit into the cart from a card (the "+" on a product tile, "Move to cart" in the wishlist). Stock is asked
// for on click (list responses carry no quantity), so a full listing costs no stock requests. `onAdded` runs once
// the unit is in the cart.
export function useQuickAdd(item: QuickAddItem, onAdded?: () => void) {
  const api = useMemo(() => create_api(make_client_access()), []);
  const query_client = useQueryClient();
  const add = useCartStore((s) => s.add);
  const show_added = useAddedToCart((s) => s.show);
  const [state, setState] = useState<QuickAddState>("idle");

  const run = async (e: React.MouseEvent) => {
    // The card is a link; the button must not navigate.
    e.preventDefault();
    e.stopPropagation();
    if (state === "busy") return;
    setState("busy");
    try {
      const stock = await query_client.fetchQuery(stock_query(api, { sku: item.sku }));
      if (!stock.is_in_stock || stock.quantity < 1) {
        setState("none");
        return;
      }
      add(item, 1, stock.quantity);
      show_added({
        sku: item.sku,
        name: item.name,
        quantity: 1,
        price: item.price,
        image: item.media[0]?.[0]?.uri ?? null,
      });
      setState("added");
      onAdded?.();
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("idle");
    }
  };

  return { state, run };
}
