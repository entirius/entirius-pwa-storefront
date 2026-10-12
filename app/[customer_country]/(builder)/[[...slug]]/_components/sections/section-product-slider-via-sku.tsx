// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React from "react";
import { SectionShell } from "./section-text";
import { ProductRail } from "./product-rail.client";
import type { CmsButtonData } from "../cms-button";

// Hand-picked products: every `tile-product` child is one card.
export default function SectionProductSliderViaSku({
  title,
  description,
  custom_buttons,
  grid,
  children,
}: {
  title?: string;
  description?: string;
  custom_buttons?: CmsButtonData[];
  grid?: string;
  children?: React.ReactNode;
}) {
  return (
    <SectionShell title={title} description={description} custom_buttons={custom_buttons}>
      <ProductRail layout={grid}>{children}</ProductRail>
    </SectionShell>
  );
}
