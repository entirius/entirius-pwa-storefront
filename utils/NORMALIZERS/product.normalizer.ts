// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { NORM_MEDIA_DATA } from "@/utils/NORMALIZERS/media.normalizer";
import { NORM_PRICE_DATA, type RawPrice } from "@/utils/NORMALIZERS/price.normalizer";
import type { ProductCategory } from "@/lib/categories";
import { is_story } from "@/lib/rich-html";

function main_media(product: { media?: unknown[]; main_image?: unknown }): unknown[] {
  if (product.media?.length) return product.media;
  return product.main_image ? [product.main_image] : [];
}

// Only a fixed list price can go to the cart. A range price belongs to a
// CONFIGURABLE parent (a variant is bought, and variants are not selectable
// yet); no price means CUSTOM, sold through an individual offer.
function is_purchasable(price: RawPrice | null | undefined): boolean {
  return !!price && !price.is_range && !!price.gross;
}

// `parts` keeps the single values (with the idx the catalog filter knows) behind the joined `value`.
export type SpecRow = {
  idx: string | null;
  name: string;
  value: string;
  parts: { label: string; value_idx: string | null }[];
};

export type SpecGroup = {
  name: string | null; // null: attributes without a group
  rows: SpecRow[];
};

// A long-text attribute shown as a section of its own after the specification.
export type Story = { idx: string; name: string; html: string };

type RawAttribute = {
  feature_idx?: string;
  feature_name?: string;
  feature_type?: string;
  value?: string | null;
  value_idx?: string | null;
  is_visible?: boolean;
  group_idx?: string | null;
  group_name?: string | null;
  group_position?: number | null;
};

// `attributes` (include=full) → visible specs, grouped by `group_*` in
// `group_position` order, backend order inside a group. A MULTISELECT comes as
// one row per chosen value; those are joined into one row.
function NORM_SPEC_GROUPS(attributes: RawAttribute[] | null | undefined): SpecGroup[] {
  const groups = new Map<string, SpecGroup & { position: number }>();
  const rows = new Map<string, SpecRow>();
  for (const a of attributes ?? []) {
    if (!a?.is_visible || !a.feature_name || a.value == null || a.value === "" || is_story(a)) continue;
    const group_key = a.group_idx ?? "";
    let group = groups.get(group_key);
    if (!group) {
      group = { name: a.group_name ?? null, rows: [], position: a.group_position ?? Infinity };
      groups.set(group_key, group);
    }
    const row_key = `${group_key}\n${a.feature_idx ?? a.feature_name}`;
    const row = rows.get(row_key);
    const part = { label: String(a.value), value_idx: a.value_idx ?? null };
    if (row) {
      row.value = `${row.value}, ${a.value}`;
      row.parts.push(part);
    } else {
      const created = { idx: a.feature_idx ?? null, name: a.feature_name, value: String(a.value), parts: [part] };
      rows.set(row_key, created);
      group.rows.push(created);
    }
  }
  return [...groups.values()]
    .sort((a, b) => a.position - b.position)
    .map(({ name, rows }) => ({ name, rows }));
}

function NORM_STORIES(attributes: RawAttribute[] | null | undefined): Story[] {
  return (attributes ?? [])
    .filter((a) => a?.feature_idx && a.feature_name && is_story(a))
    .map((a) => ({ idx: a.feature_idx as string, name: a.feature_name as string, html: String(a.value) }));
}

// A product of matrix `products/` (list answers, and `include=full` for the product page): the fields the
// storefront reads.
export type RawProduct = {
  sku: string;
  name: string;
  url_key: string;
  description?: string | null;
  short_description?: string | null;
  on_stock?: boolean;
  product_type?: string;
  parent_url_key?: string | null;
  price?: RawPrice | null;
  media?: unknown[];
  main_image?: unknown;
  attributes?: RawAttribute[] | null;
  badges?: { idx: string; name: string }[] | null;
  brands?: { idx?: string; name: string }[] | null;
  categories?: ProductCategory[];
  url_keys?: Record<string, string> | null;
};

export type Product = ReturnType<typeof NORM_PRODUCTS_DATA>[number];

function NORM_PRODUCTS_DATA(products: RawProduct[] | null | undefined) {
  if (!products) {
    return [];
  }
  return products.map((product) => ({
    ...product,
    price: NORM_PRICE_DATA(product.price),
    // Kept apart: the display price tuple has no room for it.
    percent_off: product.price?.has_special_price ? product.price.percent_off : null,
    specs: NORM_SPEC_GROUPS(product.attributes),
    stories: NORM_STORIES(product.attributes),
    purchasable: is_purchasable(product.price),
    // List responses carry only `main_image`; full responses carry `media`.
    media: NORM_MEDIA_DATA(main_media(product), {
      sort_by: "position",
      remove_kvp: [["type", "video"]],
    }),
  }));
}

export { NORM_PRODUCTS_DATA };
