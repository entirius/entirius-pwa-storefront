// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { NORM_MEDIA_DATA } from "@/utils/NORMALIZERS/media.normalizer";
import { NORM_PRICE_DATA } from "@/utils/NORMALIZERS/price.normalizer";
import type { Price } from "@/utils/NORMALIZERS/price.normalizer";

type VariantOption = { value: string; label: string };

// One axis of a configurable product (size, colour, ...). Feature names come from the backend.
type VariantAxis = { idx: string; label: string; options: VariantOption[] };

type Variant = {
  sku: string;
  name: string;
  on_stock: boolean;
  // axis idx -> option value
  selection: Record<string, string>;
  // option labels in axis order, for cart lines
  labels: string[];
  price: Price | null;
  // lowest payable gross as a number (special price when it applies), null without a price
  amount: number | null;
  // empty when the variant has no pictures of its own
  media: ReturnType<typeof NORM_MEDIA_DATA>;
};

type VariantsData = { axes: VariantAxis[]; variants: Variant[] };

type RawPrice = {
  gross: string;
  currency: string;
  final_gross?: string | null;
  has_special_price?: boolean;
};
type RawVariantsResponse = {
  data?: {
    options?: { idx: string; label: string; options?: VariantOption[] }[];
    products?: {
      sku: string;
      on_stock?: boolean;
      attributes?: { feature_idx: string; value_idx: string }[];
    }[];
  };
};
type RawDetail = { sku: string; name?: string; price?: RawPrice | null; media?: unknown[] };

// GET products/{url_key}/variants/ answers { data: { options, products } }: axes with option labels
// and, per variant, its option values and on_stock. It has no price, name or pictures, so those come
// from the product list queried by the variant SKUs (`details`).
function NORM_VARIANTS_DATA(response: RawVariantsResponse, details: RawDetail[]): VariantsData {
  const data = response?.data ?? {};
  const axes: VariantAxis[] = (data.options ?? []).map((axis) => ({
    idx: axis.idx,
    label: axis.label,
    options: (axis.options ?? []).map((o) => ({ value: o.value, label: o.label })),
  }));
  const detail_by_sku = new Map<string, RawDetail>((details ?? []).map((d) => [d.sku, d]));

  const variants: Variant[] = (data.products ?? []).map((p) => {
    const detail = detail_by_sku.get(p.sku);
    const selection: Record<string, string> = {};
    for (const a of p.attributes ?? []) selection[a.feature_idx] = a.value_idx;
    const price = detail?.price;
    const amount = Number(price?.has_special_price && price.final_gross ? price.final_gross : price?.gross);
    return {
      sku: p.sku,
      name: detail?.name ?? p.sku,
      on_stock: !!p.on_stock,
      selection,
      labels: axes.flatMap((axis) => {
        const option = axis.options.find((o) => o.value === selection[axis.idx]);
        return option ? [option.label] : [];
      }),
      price: NORM_PRICE_DATA(price),
      amount: price && Number.isFinite(amount) ? amount : null,
      media: NORM_MEDIA_DATA(detail?.media ?? [], {
        sort_by: "position",
        remove_kvp: [["type", "video"]],
      }),
    };
  });

  return { axes, variants };
}

export { NORM_VARIANTS_DATA };
export type { Variant, VariantAxis, VariantOption, VariantsData };
