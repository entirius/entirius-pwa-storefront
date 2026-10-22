// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { create_api } from "@/API/api.context";
import { cache } from "react";
import { API_PRODUCTS_ROUTE } from "@/API/api.routes";
import { primary_category } from "@/lib/categories";
import { RELATED_RULES } from "@/lib/product-config";
import type { RawProduct as CatalogProduct } from "@/utils/NORMALIZERS/product.normalizer";
import { load_product } from "./api.query";

type Api = ReturnType<typeof create_api>;
// What the rules read of a product; load_related hands on the whole record.
export type RawProduct = Pick<CatalogProduct, "sku" | "on_stock" | "categories" | "attributes">;

export const RELATED_LIMIT = 8;
const CANDIDATES = 16;

type Filter = { query: Record<string, string>; matches: (candidate: RawProduct) => boolean };

// One term of a rule: "category" (the product's most specific category) or an attribute idx (the product's
// first value of it). null = the product has no such thing, so the rule cannot be applied.
function term_filter(term: string, product: RawProduct): Filter | null {
  if (term === "category") {
    const category = primary_category(product.categories);
    if (!category) return null;
    return {
      query: { category: category.url_key },
      matches: (c) => !!c.categories?.some((x) => x.url_key === category.url_key),
    };
  }
  const value = product.attributes?.find((a) => a.feature_idx === term && a.value_idx)?.value_idx;
  if (!value) return null;
  return {
    query: { [`q_${term}`]: String(value) },
    matches: (c) => !!c.attributes?.some((a) => a.feature_idx === term && a.value_idx === value),
  };
}

export function rule_filter(rule: string, product: RawProduct): Filter | null {
  const filters = rule.split("+").map((term) => term_filter(term.trim(), product));
  if (filters.some((f) => !f)) return null;
  const all = filters as Filter[];
  return {
    query: Object.assign({}, ...all.map((f) => f.query)),
    // The API ignores a filter that is not defined for the channel, so every candidate is checked again.
    matches: (c) => all.every((f) => f.matches(c)),
  };
}

// Keeps what a related list may show: not the product itself, not a duplicate, not a sold-out one.
export function accept_candidates<T extends RawProduct>(
  candidates: T[],
  seen: Set<string>,
  filter: Filter,
  room: number,
): T[] {
  const taken: T[] = [];
  for (const candidate of candidates) {
    if (taken.length >= room) break;
    if (seen.has(candidate.sku) || candidate.on_stock === false || !filter.matches(candidate)) continue;
    seen.add(candidate.sku);
    taken.push(candidate);
  }
  return taken;
}

// In-stock products similar to the product at `product_url_key`, never the product itself: the rules of
// `PRODUCT.RELATED` in order, each one filling up what the previous left (up to RELATED_LIMIT). The rules are
// asked in parallel; the order only decides whose candidates go first. Keyed on the url_key (a primitive), so
// React cache() dedupes it; the product itself comes from load_product's cache.
export const load_related = cache(async (api: Api, product_url_key: string): Promise<CatalogProduct[]> => {
  const [, response] = await load_product(api, { product_url_key });
  const product = response?.results?.[0];
  if (!product) return [];

  const filters = RELATED_RULES.map((rule) => rule_filter(rule, product)).filter((f): f is Filter => f !== null);
  const answers = await Promise.all(
    filters.map((filter) =>
      api.FETCH_METHOD<{ results?: CatalogProduct[] }>(API_PRODUCTS_ROUTE, {
        querys: { ...filter.query, on_stock: "true", page_size: CANDIDATES, include: "full" },
      }),
    ),
  );

  const found: CatalogProduct[] = [];
  const seen = new Set([product.sku]);
  filters.forEach((filter, i) => {
    const [error, body] = answers[i];
    if (error || found.length >= RELATED_LIMIT) return;
    found.push(...accept_candidates(body?.results ?? [], seen, filter, RELATED_LIMIT - found.length));
  });
  return found;
});
