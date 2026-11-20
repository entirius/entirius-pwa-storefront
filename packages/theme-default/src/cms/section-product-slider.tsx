// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsSectionProductSliderProps } from "@entirius/storefront-sdk/cms";
import { SectionShell } from "@theme/cms/section-shell";
import { ProductRail } from "@theme/cms/product-rail";

// Products under a heading: hand-picked ones (`section-product-slider-via-sku`) or a category's first
// (`section-product-slider-category`). Every child is a `tile-product`.
export function SectionProductSlider({ t, title, description, links, layout, children }: CmsSectionProductSliderProps) {
  return (
    <SectionShell t={t} title={title} description={description} links={links}>
      <ProductRail layout={layout}>{children}</ProductRail>
    </SectionShell>
  );
}
