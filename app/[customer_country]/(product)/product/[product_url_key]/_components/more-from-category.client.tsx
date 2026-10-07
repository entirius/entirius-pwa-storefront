// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { ProductTile } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/product-tile.client";
import { cms_category_products_query } from "@/app/[customer_country]/(builder)/[[...slug]]/api.query";

// Up to four other products of the product's first category, below the product.
export function MoreFromCategory({
  category,
  name,
  exclude_sku,
}: {
  category: string;
  name: string;
  exclude_sku: string;
}) {
  const api = useMemo(() => create_api(make_client_access()), []);
  const { data } = useQuery(cms_category_products_query(api, category));
  const products = (data ?? []).filter((p) => p.sku !== exclude_sku).slice(0, 4);
  if (!products.length) return null;

  return (
    <section aria-labelledby="more-from-category" className="flex flex-col gap-5">
      <h2 id="more-from-category" className="text-2xl md:text-3xl">
        More {name.toLowerCase()}
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product) => (
          <ProductTile key={product.sku} product={product} />
        ))}
      </div>
    </section>
  );
}
