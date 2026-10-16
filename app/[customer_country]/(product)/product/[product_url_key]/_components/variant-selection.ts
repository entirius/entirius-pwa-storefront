// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Variant, VariantsData } from "@/utils/NORMALIZERS/variant.normalizer";

// axis idx -> chosen option value. Partial while the shopper is still choosing.
export type Selection = Record<string, string>;

// URL query parameter that carries the chosen variant SKU: /product/<url_key>?variant=<sku>.
export const VARIANT_PARAM = "variant";

const matches = (variant: Variant, selection: Selection) =>
  Object.entries(selection).every(([axis, value]) => variant.selection[axis] === value);

// The variant a complete selection points at (every axis chosen), else undefined.
export function find_variant(data: VariantsData, selection: Selection): Variant | undefined {
  if (!data.axes.length || data.axes.some((axis) => !selection[axis.idx])) return undefined;
  return data.variants.find((v) => matches(v, selection));
}

// Starting selection: the variant named by the URL, else the only buyable variant, else nothing.
// `on_stock` of the read model keeps server and first client render identical.
export function initial_selection(data: VariantsData, variant_sku: string | null): Selection {
  const linked = variant_sku ? data.variants.find((v) => v.sku === variant_sku) : undefined;
  if (linked) return linked.selection;
  const buyable = data.variants.filter((v) => v.on_stock);
  return buyable.length === 1 ? buyable[0].selection : {};
}

// Choose `value` on `axis`. Choices on other axes that no variant combines with it are dropped.
export function select_option(
  data: VariantsData,
  selection: Selection,
  axis: string,
  value: string,
): Selection {
  const next: Selection = { [axis]: value };
  for (const [other, chosen] of Object.entries(selection)) {
    if (other === axis) continue;
    const candidate = { ...next, [other]: chosen };
    if (data.variants.some((v) => matches(v, candidate))) next[other] = chosen;
  }
  return next;
}

// An option can be picked when some buyable variant has it and agrees with the choices on the other axes.
export function option_available(
  data: VariantsData,
  selection: Selection,
  axis: string,
  value: string,
  is_buyable: (variant: Variant) => boolean,
): boolean {
  const others = Object.fromEntries(Object.entries(selection).filter(([a]) => a !== axis));
  return data.variants.some(
    (v) => v.selection[axis] === value && matches(v, others) && is_buyable(v),
  );
}

// Lowest price over the variants; `differs` is true when the variants are not all priced the same.
export function lowest_price(variants: Variant[]): { variant: Variant; differs: boolean } | null {
  const priced = variants.filter((v) => v.amount !== null && v.price);
  if (!priced.length) return null;
  const variant = priced.reduce((low, v) => (v.amount! < low.amount! ? v : low));
  return { variant, differs: priced.some((v) => v.amount !== variant.amount) };
}
