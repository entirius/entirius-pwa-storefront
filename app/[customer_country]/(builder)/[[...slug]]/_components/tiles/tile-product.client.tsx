// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { ProductTile } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/product-tile.client";
import { cms_product_by_sku_query } from "../../api.query";

export function ProductTileSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      <div className="aspect-square w-full animate-pulse rounded-xl bg-muted" />
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="h-5 w-1/3 rounded bg-muted" />
    </div>
  );
}

// One product picked by SKU in the CMS. The page prefetches every SKU in one
// batch; a tile that is not seeded fetches its own. A SKU the channel does not
// sell renders nothing.
export default function TileProduct({ sku }: { sku?: string }) {
  const api = useMemo(() => create_api(make_client_access()), []);
  const { data: product, isLoading } = useQuery({
    ...cms_product_by_sku_query(api, sku ?? ""),
    enabled: !!sku,
  });

  if (!sku) return null;
  if (isLoading) return <ProductTileSkeleton />;
  if (!product) return null;
  return <ProductTile product={product} />;
}
