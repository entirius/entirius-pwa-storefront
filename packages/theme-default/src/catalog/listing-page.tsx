// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useListingPage } from "@entirius/storefront-sdk/catalog/listing";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Spinner } from "@theme/ui/spinner";
import { ListingHeader } from "@theme/catalog/listing-header";
import { ListingFilters } from "@theme/catalog/filters";
import { FiltersSheet } from "@theme/catalog/filters-sheet";
import { ListingPagination } from "@theme/catalog/pagination";
import { ProductGrid } from "@theme/catalog/product-grid";
import { ListingEmpty } from "@theme/catalog/listing-empty";

// A category's products or a search's results: the default arrangement of the listing's parts. Every part reads the
// listing from useListingPage(), so a theme replaces this file to move, drop or add parts, or one part's file to
// change only that part.
export function ListingPage() {
  const { t } = useI18n();
  const { hint, status, error, products, list_ref } = useListingPage();

  return (
    <>
      <ListingHeader />
      {hint ? (
        <p data-search-hint className="py-12 text-center text-muted-foreground">
          {hint}
        </p>
      ) : status === "loading" ? (
        <Spinner className="mx-auto size-8" />
      ) : status === "error" ? (
        <div>{t("common.error", { message: error ?? "" })}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
          {/* Desktop: the filters stay beside the listing. Phones open them in a sheet. */}
          <aside
            data-filters-panel
            aria-label={t("catalog.filters")}
            className="surface hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
          >
            <ListingFilters place="sidebar" />
          </aside>
          <div data-catalog-list ref={list_ref} className="min-w-0 scroll-mt-24 md:scroll-mt-32">
            <div className="mb-4 flex items-center justify-between gap-4">
              <FiltersSheet />
              <ListingPagination className="mx-0 ml-auto size-auto" />
            </div>
            {products.length === 0 ? <ListingEmpty /> : <ProductGrid />}
            {products.length > 0 && <ListingPagination className="mt-8" />}
          </div>
        </div>
      )}
    </>
  );
}
