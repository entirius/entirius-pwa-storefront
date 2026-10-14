// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

type Attribute = { feature_idx: string; value: string | null; is_visible: boolean };

// The facts of a "tell me when a similar product arrives" request: what the shopper looked at, so the seller
// can match it later. Values of the configured attribute idxs are joined per idx (a multi-select has several).
export function notify_body(
  product: { sku: string; name: string; attributes?: Attribute[] },
  category_name: string | undefined,
  attribute_idxs: string[],
): Record<string, string | undefined> {
  const facts = Object.fromEntries(
    attribute_idxs.map((idx) => {
      const values = (product.attributes ?? []).filter((a) => a.feature_idx === idx && a.is_visible && a.value);
      return [idx, values.map((a) => a.value).join(" / ") || undefined];
    }),
  );
  return { product_sku: product.sku, product_name: product.name, category: category_name, ...facts };
}
