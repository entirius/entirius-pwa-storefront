// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { useCartStore } from "@/stores/cart.store";
import type { Price } from "@/utils/NORMALIZERS/price.normalizer";
import { stock_query } from "@/app/[customer_country]/(product)/product/[product_url_key]/stock.query";

type QuickAddItem = {
  sku: string;
  name: string;
  url_key: string;
  price: Price;
  media: { uri: string; width: number; height: number }[][];
};

// "+" on a product card: one unit into the cart. Stock is asked for on click
// (list responses carry no quantity), so a full listing costs no stock requests.
export function QuickAdd({ item }: { item: QuickAddItem }) {
  const api = useMemo(() => create_api(make_client_access()), []);
  const query_client = useQueryClient();
  const add = useCartStore((s) => s.add);
  const [state, setState] = useState<"idle" | "busy" | "added" | "none">("idle");

  const onClick = async (e: React.MouseEvent) => {
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
      setState("added");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("idle");
    }
  };

  const label =
    state === "none" ? `${item.name} is out of stock` : state === "added" ? `${item.name} added to cart` : `Add ${item.name} to cart`;

  return (
    <Button
      type="button"
      size="icon-lg"
      className="shrink-0 rounded-full"
      aria-label={label}
      disabled={state === "none"}
      onClick={onClick}
    >
      {state === "busy" ? (
        <Spinner className="size-4" />
      ) : state === "added" ? (
        <Check className="size-5" />
      ) : (
        <Plus className="size-5" />
      )}
    </Button>
  );
}
