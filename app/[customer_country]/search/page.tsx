// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Metadata } from "next";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { omnibus_prefetch, is_discounted } from "@/lib/omnibus/omnibus.query";
import { get_server_api } from "@/lib/seo/server-api";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { SEARCH_MIN_CHARS } from "@/lib/search/search.query";
import {
  catalog_query,
  listing_filters,
  load_catalog,
} from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/api.query";
import { ListingPageRuntime } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/listing-runtime.client";
import { ListingPage } from "@theme/catalog/listing-page";

// Search results: the catalog listing (tiles, filters, sorting, pagination) over `products/?search=`, which
// finds what the header's search sheet finds, in the same order, in the catalog's shape.

interface Props {
  searchParams: Promise<{
    q?: string | string[];
    page?: string;
    limit?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

// A repeated `q` counts once.
const phrase = (q: string | string[] | undefined) => (Array.isArray(q) ? q[0] : (q ?? "")).trim();

// Not for search engines: results pages are endless and thin (robots.txt closes them too).
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = phrase((await searchParams).q);
  const { t } = await get_i18n();
  return {
    title: q ? t("search.results_title", { query: q }) : t("search.title"),
    robots: { index: false },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q: raw_q, page = "1", limit = "16", ...search_params } = await searchParams;
  const q = phrase(raw_q);
  const { t } = await get_i18n();

  const trail = [{ name: t("search.title") }];
  const header = (title: string) => ({ title, trail, description_html: null, description_long: false, subcategories: [] });

  if (q.length < SEARCH_MIN_CHARS) {
    return (
      <ListingPageRuntime
        kind="search"
        options={null}
        header={header(t("search.title"))}
        hint={t("search.min_chars", { count: SEARCH_MIN_CHARS })}
      >
        <ListingPage />
      </ListingPageRuntime>
    );
  }

  const options = {
    search: q,
    page,
    page_size: limit,
    ...listing_filters(search_params),
  };

  // Omnibus lines for the reduced prices on this page, in the server HTML (as on the catalog page).
  const api_access_context = await get_server_api();
  const [, response] = await load_catalog(api_access_context, options);
  const discounted_skus: string[] = (response?.results ?? [])
    .filter((p: { price?: unknown }) => is_discounted(p.price))
    .map((p: { sku: string }) => p.sku);

  return (
    <PrefetchBoundary
      prefetches={[
        catalog_query(api_access_context, options),
        ...(discounted_skus.length
          ? [omnibus_prefetch(api_access_context, discounted_skus)]
          : []),
      ]}
    >
      {/* A new phrase is the same route: the key remounts the listing, so the filter panel drops the
          previous phrase's choices (its store is read from the URL on mount). */}
      <ListingPageRuntime key={q} kind="search" options={options} header={header(t("search.results_title", { query: q }))}>
        <ListingPage />
      </ListingPageRuntime>
    </PrefetchBoundary>
  );
}
