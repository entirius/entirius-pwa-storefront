"use client";

import { useQuery } from "@tanstack/react-query";
import { catalog_query } from "../api.query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { useMemo } from "react";
import { ProductTile } from "./product-tile.client";
import { PaginationClient } from "./pagination.client";
import { FiltersTriggerClient } from "./filters-trigger.client";
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <FiltersTriggerClient options={options} />
        <PaginationClient
          pagination={data.pagination}
          current_page={Number(options.page ?? 1)}
          className="mx-0 size-auto"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data?.data?.map((product: any) => (
          <ProductTile key={product.sku ?? "no-sku-error"} product={product} />
        )) ?? <div>No products</div>}
      </div>
    </div>
  );
}
