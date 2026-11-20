// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { RichText } from "@entirius/storefront-sdk/components/rich-text";
import { useProductPage } from "@entirius/storefront-sdk/product/page";

export function ProductDescription() {
  const { product } = useProductPage();
  if (!product.description_html) return null;

  return (
    <div className="border-t pt-8">
      <RichText html={product.description_html} className="text-muted-foreground" />
    </div>
  );
}
