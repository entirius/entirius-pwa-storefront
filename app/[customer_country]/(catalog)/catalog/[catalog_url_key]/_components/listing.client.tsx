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
import { useI18n } from "@/providers/i18n.provider";

export function ListingClient({ options }: { options: any }) {
  const { t } = useI18n();
  const api_access_context = useMemo(
    () => create_api(make_client_access()),
    [],
  );

  const { data, isLoading, isError, error } = useQuery({
    ...catalog_query(api_access_context, options),
    refetchOnWindowFocus: true,
  });

  if (isLoading) return <Spinner className="size-8 mx-auto" />;
  if (isError) return <div>{t("common.error", { message: (error as Error)?.message })}</div>;
  if (!data) return <div>{t("common.no_data")}</div>;

  const products = data.data ?? [];

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
      {products.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{t("catalog.no_products")}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product: any) => (
            <ProductTile key={product.sku ?? "no-sku-error"} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
