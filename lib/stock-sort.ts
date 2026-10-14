// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { SORT_IN_STOCK_FIRST } from "@/lib/product-config";

// The API takes repeated `s_` params in precedence order. With `CATALOG.SORT_IN_STOCK_FIRST` on and a sort chosen
// by the customer, available items go first and the chosen sort orders within them
// (`s_on_stock=desc&s_price=asc`); otherwise sold items mix in as the API orders them.
// Works on the plain object built from the query string: insertion order is the precedence.
export function with_stock_first<T extends Record<string, unknown>>(params: T, enabled = SORT_IN_STOCK_FIRST): T {
  const has_sort = Object.keys(params).some((key) => key.startsWith("s_"));
  if (!enabled || !has_sort || "s_on_stock" in params) return params;
  return { s_on_stock: "desc", ...params };
}
