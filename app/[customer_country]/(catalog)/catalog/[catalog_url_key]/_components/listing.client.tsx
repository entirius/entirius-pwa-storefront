// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useQuery } from "@tanstack/react-query";
import { catalog_query } from "../api.query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { useMemo } from "react";
import { ProductTile } from "./product-tile.client";
import { PaginationClient } from "./pagination.client";
import { FiltersTriggerClient } from "./filters-trigger.client";
import { FiltersOptionsClient } from "./filters-options.client";
import { Spinner } from "@/components/ui/spinner";

export function ListingClient({ options }: { options: any }) {
  const api_access_context = useMemo(
    () => create_api(make_client_access()),
    [],
  );

  const { data, isLoading, isError, error } = useQuery({
    ...catalog_query(api_access_context, options),
    refetchOnWindowFocus: true,
  });

  if (isLoading) return <Spinner className="size-8 mx-auto" />;
  if (isError) return <div>Error: {(error as Error)?.message}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
      {/* Desktop: the filters stay beside the listing. Phones open them in a sheet. */}
      <aside aria-label="Filters" className="hidden rounded-3xl bg-card p-5 lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <FiltersOptionsClient options={options} />
      </aside>
      <div className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-4">
          <FiltersTriggerClient options={options} />
          <PaginationClient
            pagination={data.pagination}
            current_page={Number(options.page ?? 1)}
            className="mx-0 ml-auto size-auto"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {data?.data?.map((product: any) => (
            <ProductTile key={product.sku ?? "no-sku-error"} product={product} />
          )) ?? <div>No products</div>}
        </div>
      </div>
    </div>
  );
}
