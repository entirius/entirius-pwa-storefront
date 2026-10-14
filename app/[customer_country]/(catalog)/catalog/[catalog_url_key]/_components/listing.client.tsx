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
import { NotifySimilar } from "@/components/notify-similar.client";
import { useI18n } from "@/providers/i18n.provider";

export function ListingClient({ options, category_name }: { options: any; category_name?: string }) {
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
  // An empty result under filters is not an empty category.
  const has_filters = Object.keys(options).some((key) => /^[qr]_/.test(key));

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
      {/* Desktop: the filters stay beside the listing. Phones open them in a sheet. */}
      <aside aria-label={t("catalog.filters")} className="hidden rounded-3xl bg-card p-5 lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <FiltersOptionsClient options={options} />
      </aside>
      <div data-catalog-list className="min-w-0 scroll-mt-24">
        <div className="mb-4 flex items-center justify-between gap-4">
          <FiltersTriggerClient options={options} />
          <PaginationClient
            pagination={data.pagination}
            current_page={Number(options.page ?? 1)}
            className="mx-0 ml-auto size-auto"
          />
        </div>
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center text-muted-foreground" data-catalog-empty>
            <p>{t("catalog.no_products")}</p>
            {!has_filters && (
              <NotifySimilar
                body={{ category: category_name }}
                trigger_label={t("catalog.notify_cta")}
                title_key="notify.title_category"
                className="max-w-md text-foreground"
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {products.map((product: any) => (
              <ProductTile key={product.sku ?? "no-sku-error"} product={product} />
            ))}
          </div>
        )}
        {products.length > 0 && (
          <PaginationClient
            pagination={data.pagination}
            current_page={Number(options.page ?? 1)}
            className="mt-8"
          />
        )}
      </div>
    </div>
  );
}
