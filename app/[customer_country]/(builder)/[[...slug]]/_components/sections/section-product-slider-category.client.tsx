// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { ProductTile } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/product-tile.client";
import { SectionShell } from "./section-text";
import { ProductRail } from "./product-rail.client";
import { ProductTileSkeleton } from "../tiles/tile-product.client";
import { cms_category_products_query, CMS_CATEGORY_PRODUCTS_LIMIT } from "../../api.query";
import type { CmsButtonData } from "../cms-button";

// The first products of a category; `custom_field` holds its url_key.
export default function SectionProductSliderCategory({
  title,
  description,
  custom_buttons,
  custom_field,
  grid,
}: {
  title?: string;
  description?: string;
  custom_buttons?: CmsButtonData[];
  custom_field?: string;
  grid?: string;
}) {
  const category = custom_field?.trim() ?? "";
  const api = useMemo(() => create_api(make_client_access()), []);
  const { data: products, isLoading } = useQuery({
    ...cms_category_products_query(api, category),
    enabled: !!category,
  });

  if (!category || (!isLoading && !products?.length)) return null;

  return (
    <SectionShell title={title} description={description} custom_buttons={custom_buttons}>
      <ProductRail layout={grid}>
        {isLoading
          ? Array.from({ length: Math.min(4, CMS_CATEGORY_PRODUCTS_LIMIT) }, (_, i) => (
              <ProductTileSkeleton key={i} />
            ))
          : products?.map((product) => <ProductTile key={product.sku} product={product} />)}
      </ProductRail>
    </SectionShell>
  );
}
