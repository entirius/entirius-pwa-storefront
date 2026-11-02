// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/providers/i18n.provider";
import { buy_block } from "@/lib/buy-rules";
import type { Price } from "@/utils/NORMALIZERS/price.normalizer";
import type { Variant, VariantsData } from "@/utils/NORMALIZERS/variant.normalizer";
import { variants_query } from "../api.query";
import { stocks_query } from "../stock.query";
import {
  VARIANT_PARAM,
  find_variant,
  initial_selection,
  lowest_price,
  option_available,
  select_option,
  type Selection,
} from "./variant-selection";

type Api = Parameters<typeof variants_query>[0];
type ProductSummary = { product_type?: string; name: string; price: Price | null };

const EMPTY: VariantsData = { axes: [], variants: [] };

// Everything the product page needs to sell a configurable product. Returns null for other
// product types, which keep the plain single-SKU page. Choosing options is client state seeded
// from ?variant=<sku> and written back to it once the choice names a variant.
export function useProductVariants(
  api: Api,
  product: ProductSummary | null | undefined,
  product_url_key: string,
) {
  const { t } = useI18n();
  const configurable = product?.product_type === "CONFIGURABLE";
  const { data: loaded } = useQuery({ ...variants_query(api, { product_url_key }), enabled: configurable });
  const data = loaded ?? EMPTY;
  const skus = data.variants.map((v) => v.sku);
  const { data: stocks } = useQuery({
    ...stocks_query(api, { skus }),
    enabled: configurable && skus.length > 0,
  });

  const variant_param = useSearchParams().get(VARIANT_PARAM);
  const [chosen, setChosen] = useState<Selection | null>(null);
  // The variant SKU this component last put into the URL itself, so it does not react to its own write.
  const [written, setWritten] = useState<string | null>(variant_param);
  const [seen_param, setSeenParam] = useState(variant_param);
  const selection = chosen ?? initial_selection(data, variant_param);
  const variant = find_variant(data, selection);

  // Real-time stock when it has arrived, the read model's flag until then (and if the call fails): enough to
  // grey out options and pick the first one, never to buy.
  const available = (v: Variant) => (stocks ? (stocks[v.sku]?.quantity ?? 0) > 0 : v.on_stock);

  // A link to another variant while this page is mounted (search results, cart): follow it.
  if (variant_param !== seen_param) {
    setSeenParam(variant_param);
    const linked = variant_param !== written && data.variants.find((v) => v.sku === variant_param);
    if (linked) {
      setChosen(linked.selection);
      setWritten(variant_param);
    }
  }

  const choose = (axis: string, value: string) => {
    const next = select_option(data, selection, axis, value);
    const sku = find_variant(data, next)?.sku ?? null;
    setChosen(next);
    setWritten(sku);
    const url = new URL(window.location.href);
    if (sku) url.searchParams.set(VARIANT_PARAM, sku);
    else url.searchParams.delete(VARIANT_PARAM);
    window.history.replaceState(null, "", url);
  };

  if (!configurable) return null;

  const cheapest = lowest_price(data.variants);
  const price: Price | null = variant ? variant.price : (cheapest?.variant.price ?? product?.price ?? null);
  const any_available = data.variants.some(available);
  // Buying reads the real-time answer only: undefined until it is there (or when the call fails), and a SKU
  // missing from it is out of stock.
  const quantity = variant && stocks ? (stocks[variant.sku]?.quantity ?? 0) : undefined;
  const block = buy_block("CONFIGURABLE", { variant: !!variant, quantity, price: variant?.price ?? null });

  return {
    axes: data.axes,
    selection,
    choose,
    is_available: (axis: string, value: string) =>
      option_available(data, selection, axis, value, available),
    price,
    // "from <price>" while no variant is chosen and the variants are not all priced the same
    price_from: !variant && !!cheapest?.differs,
    // the chosen variant's own pictures; undefined = keep the product's
    media: variant?.media.length ? variant.media : undefined,
    in_stock: quantity !== undefined && quantity > 0,
    // the real-time stock of the variants has answered
    stock_known: stocks !== undefined,
    // no variant can be bought at all (a chosen variant being sold out is not this)
    sold_out: !any_available,
    max: quantity ?? 0,
    block,
    cta: !variant
      ? any_available
        ? t("product.choose_option")
        : t("product.out_of_stock")
      : block === "quantity"
        ? t("product.out_of_stock")
        : block === "price"
          ? t("product.not_available_online")
          : t("product.add_to_cart"),
    // what goes into the cart: the variant's SKU, the product name with the chosen options
    buy: variant && {
      sku: variant.sku,
      name: `${product?.name} (${variant.labels.join(", ")})`,
      price: variant.price,
    },
  };
}
