// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useProductPage } from "@entirius/storefront-sdk/product/page";
import { cn } from "@theme/lib/utils";

// Similar products: under the buy area when the product is sold, at the bottom otherwise. Whether the section holds
// any is read from the DOM by CSS (`has-[[data-related-products]]`).
export function ProductRelated() {
  const { related, stock } = useProductPage();

  return (
    <div
      data-stock={stock.sold ? "out" : "in"}
      className={cn("group/related hidden has-[[data-related-products]]:block", stock.sold && "border-t border-border pt-5")}
    >
      {related}
    </div>
  );
}
