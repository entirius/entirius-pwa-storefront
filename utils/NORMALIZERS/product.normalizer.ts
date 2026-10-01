import { NORM_MEDIA_DATA } from "@/utils/NORMALIZERS/media.normalizer";
import { NORM_PRICE_DATA } from "@/utils/NORMALIZERS/price.normalizer";

function main_media(product: { media?: unknown[]; main_image?: unknown }): unknown[] {
  if (product.media?.length) return product.media;
  return product.main_image ? [product.main_image] : [];
}

// Only a fixed list price can go to the cart. A range price belongs to a
// CONFIGURABLE parent (a variant is bought, and variants are not selectable
// yet); no price means CUSTOM, sold through an individual offer.
function is_purchasable(price: { gross?: unknown; is_range?: boolean } | null | undefined): boolean {
  return !!price && !price.is_range && !!price.gross;
}

export type SpecGroup = {
  name: string | null; // null: attributes without a group
  rows: { name: string; value: string }[];
};

type RawAttribute = {
  feature_idx?: string;
  feature_name?: string;
  value?: string | null;
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
  const rows = new Map<string, { name: string; value: string }>();
  for (const a of attributes ?? []) {
    if (!a?.is_visible || !a.feature_name || a.value == null || a.value === "") continue;
    const group_key = a.group_idx ?? "";
    let group = groups.get(group_key);
    if (!group) {
      group = { name: a.group_name ?? null, rows: [], position: a.group_position ?? Infinity };
      groups.set(group_key, group);
    }
    const row_key = `${group_key}\n${a.feature_idx ?? a.feature_name}`;
    const row = rows.get(row_key);
    if (row) {
      row.value = `${row.value}, ${a.value}`;
    } else {
      const created = { name: a.feature_name, value: String(a.value) };
      rows.set(row_key, created);
      group.rows.push(created);
    }
  }
  return [...groups.values()]
    .sort((a, b) => a.position - b.position)
    .map(({ name, rows }) => ({ name, rows }));
}

function NORM_PRODUCTS_DATA(products: any[]) {
  if (!products) {
    return [];
  }
  return products.map((product) => ({
    ...product,
    price: NORM_PRICE_DATA(product.price),
    // Kept apart: the display price tuple has no room for it.
    percent_off: product.price?.has_special_price ? product.price.percent_off : null,
    specs: NORM_SPEC_GROUPS(product.attributes),
    purchasable: is_purchasable(product.price),
    // List responses carry only `main_image`; full responses carry `media`.
    media: NORM_MEDIA_DATA(main_media(product), {
      sort_by: "position",
      remove_kvp: [["type", "video"]],
    }),
  }));
}

export { NORM_PRODUCTS_DATA };
