// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { create_api } from "@/API/api.context";
import { cache } from "react";
import { API_PRODUCTS_ROUTE } from "@/API/api.routes";
import { primary_category, type ProductCategory } from "@/lib/categories";
import { RELATED_RULES } from "@/lib/product-config";

type Api = ReturnType<typeof create_api>;
type Attribute = { feature_idx: string; value_idx: string | null };
export type RawProduct = {
  sku: string;
  on_stock?: boolean;
  categories?: ProductCategory[];
  attributes?: Attribute[];
  url_key?: string;
  short_description?: string | null;
  description?: string | null;
  [key: string]: unknown;
};

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
export function accept_candidates(
  candidates: RawProduct[],
  seen: Set<string>,
  filter: Filter,
  room: number,
): RawProduct[] {
  const taken: RawProduct[] = [];
  for (const candidate of candidates) {
    if (taken.length >= room) break;
    if (seen.has(candidate.sku) || candidate.on_stock === false || !filter.matches(candidate)) continue;
    seen.add(candidate.sku);
    taken.push(candidate);
  }
  return taken;
}

// In-stock products similar to `product`, never the product itself: the rules of `PRODUCT.RELATED` in order,
// each one filling up what the previous left (up to RELATED_LIMIT).
export const load_related = cache(async (api: Api, product: RawProduct): Promise<RawProduct[]> => {
  const found: RawProduct[] = [];
  const seen = new Set([product.sku]);
  for (const rule of RELATED_RULES) {
    if (found.length >= RELATED_LIMIT) break;
    const filter = rule_filter(rule, product);
    if (!filter) continue;
    const [error, response] = await api.FETCH_METHOD(API_PRODUCTS_ROUTE, {
      querys: { ...filter.query, on_stock: "true", page_size: CANDIDATES, include: "full" },
    });
    if (error) continue;
    const results = (response as { results?: RawProduct[] } | null)?.results ?? [];
    found.push(...accept_candidates(results, seen, filter, RELATED_LIMIT - found.length));
  }
  return found;
});
