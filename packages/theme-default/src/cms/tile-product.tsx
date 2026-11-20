// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsTileProductProps } from "@entirius/storefront-sdk/cms";
import { ProductCard } from "@theme/components/product-card";

// A product of a CMS product section, in the shop's product card.
export function TileProduct({ product }: CmsTileProductProps) {
  return <ProductCard product={product} />;
}
