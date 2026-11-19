// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useListingPage } from "@entirius/storefront-sdk/catalog/listing";
import { ProductCard } from "@theme/components/product-card";

// The products of the current page; the columns from md up come from --catalog-columns (tokens.css).
export function ProductGrid() {
  const { products } = useListingPage();
  return (
    <div data-product-grid className="grid grid-cols-2 gap-4 md:grid-cols-[repeat(var(--catalog-columns),minmax(0,1fr))]">
      {products.map((product) => (
        <ProductCard key={product.sku} product={product} />
      ))}
    </div>
  );
}
