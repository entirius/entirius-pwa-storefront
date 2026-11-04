// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import { API_CART_DISCOUNTS_ROUTE, API_CART_GRATIS_RULES_ROUTE, API_PRODUCTS_ROUTE } from "@/API/api.routes";
import { NORM_CART, NORM_GRATIS_RULES, type Cart, type GratisRule } from "@/utils/NORMALIZERS/cart.normalizer";
import { NORM_PRODUCTS_DATA, type RawProduct } from "@/utils/NORMALIZERS/product.normalizer";
import { discounts_body, kept_discounts, with_gift, type DiscountInput } from "@/utils/cart-discounts";
import type { CartItem } from "@/stores/cart.store";

type Api = ReturnType<typeof create_api>;

// What a gift line or a gift option shows: the product as the cart keeps it.
export type GiftProduct = Omit<CartItem, "quantity">;

const NO_RULES: GratisRule[] = [];
const NO_PRODUCTS: Record<string, GiftProduct> = {};

// The cart's gratis rules (checkout #22 will also put them in the cart's `gratis.rules`). Keyed on the cart's
// total: the tiers follow the cart's value, and every change of items or codes changes the total.
const gratis_rules_query = (api: Api, cart_id: string, total: string | null) => ({
  queryKey: ["gratis-rules", cart_id, total] as const,
  queryFn: async () => {
    const [error, response] = await api.FETCH_METHOD(API_CART_GRATIS_RULES_ROUTE);
    if (error) throw new Error(error.message);
    return NORM_GRATIS_RULES(response);
  },
});

// Names and pictures of the gifts: the rules and the cart's gift lines carry SKUs only.
const gift_products_query = (api: Api, skus: string[]) => ({
  queryKey: ["gift-products", skus] as const,
  staleTime: 5 * 60_000,
  queryFn: async () => {
    const [error, response] = await api.FETCH_METHOD<{ results?: RawProduct[] }>(API_PRODUCTS_ROUTE, {
      querys: { sku: skus, page_size: skus.length },
    });
    if (error) throw new Error(error.message);
    const products: Record<string, GiftProduct> = {};
    for (const p of NORM_PRODUCTS_DATA(response?.results ?? [])) {
      products[p.sku] = { sku: p.sku, name: p.name, url_key: p.url_key, price: p.price, media: p.media };
    }
    return products;
  },
});

function useApi() {
  return useMemo(() => create_api(make_client_access()), []);
}

export function useGiftProducts(skus: string[]) {
  const api = useApi();
  const sorted = [...new Set(skus)].sort();
  const { data } = useQuery({ ...gift_products_query(api, sorted), enabled: sorted.length > 0 });
  return data ?? NO_PRODUCTS;
}

// The gratis rules the cart qualifies for and the products of their gifts and of the gifts already picked.
export function useCartGifts(backend: Cart | null | undefined) {
  const api = useApi();
  const cart_id = backend?.cart_id ?? "";
  const { data: rules } = useQuery({
    ...gratis_rules_query(api, cart_id, backend?.total_gross ?? null),
    enabled: !!cart_id && !!backend?.gratis.is_available,
    // A new total refetches the rules; the picker keeps the last ones meanwhile instead of blinking.
    placeholderData: keepPreviousData,
  });
  const active = backend?.gratis.is_available ? (rules ?? NO_RULES) : NO_RULES;
  const products = useGiftProducts([
    ...active.flatMap((r) => r.items.map((i) => i.sku)),
    ...(backend?.gifts ?? []).map((g) => g.sku),
  ]);
  return { rules: active, products };
}

// PATCH discounts/ with the full set of manual codes; every cart query (cart page, checkout) gets the answer.
// Resolves to the error text, or to the new cart.
export function useDiscountsPatch() {
  const api = useApi();
  const query_client = useQueryClient();
  return useCallback(
    async (codes: DiscountInput[]): Promise<{ error: string | null; cart: Cart | null }> => {
      const [error, response] = await api.FETCH_METHOD(API_CART_DISCOUNTS_ROUTE, {
        method: "PATCH",
        body: JSON.stringify(discounts_body(codes)),
      });
      if (error) return { error: error.message || "", cart: null };
      const cart = NORM_CART(response);
      query_client.setQueriesData({ queryKey: ["cart"] }, cart);
      return { error: null, cart };
    },
    [api, query_client],
  );
}

// Picks, changes or drops (quantity 0) the gift of one gratis rule; the cart's other codes stay. `failed`: the
// call failed or the backend did not keep the gift.
export function useGiftSetter(backend: Cart | null | undefined) {
  const patch = useDiscountsPatch();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const set_gift = (code: string, sku: string, quantity: number) => {
    setFailed(false);
    startTransition(async () => {
      const { error, cart } = await patch(with_gift(kept_discounts(backend), code, sku, quantity));
      const kept =
        quantity === 0 || !!cart?.discounts.some((d) => d.code === code && d.gratis_sku === sku && d.status === "valid");
      if (error || !kept) setFailed(true);
    });
  };
  return { set_gift, pending, failed };
}

export type GiftSetter = ReturnType<typeof useGiftSetter>;
