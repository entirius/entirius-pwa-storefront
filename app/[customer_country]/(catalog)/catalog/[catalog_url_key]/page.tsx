// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Metadata } from "next";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { decode_param } from "@/lib/route-params";
import { catalog_query, listing_filters, load_catalog, load_category } from "./api.query";
import { omnibus_prefetch, is_discounted } from "@/lib/omnibus/omnibus.query";
import { get_server_api } from "@/lib/seo/server-api";
import { build_catalog_metadata, build_catalog_jsonld } from "@/lib/seo/build";
import { catalog_alternates } from "@/lib/seo/alternates";
import { JsonLd } from "@/lib/seo/json-ld";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { ListingPage } from "@theme/catalog/listing-page";
import { ListingPageRuntime } from "./_components/listing-runtime.client";
import { category_trail } from "@/lib/breadcrumbs";

interface Props {
  params: Promise<{
    customer_country: string;
    catalog_url_key: string;
  }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { customer_country, ...route } = await params;
  const catalog_url_key = decode_param(route.catalog_url_key);
  const api = await get_server_api();
  const category = await load_category(api, { url_key: catalog_url_key });
  if (!category) return { title: (await get_i18n()).t("catalog.title") };

  const { language } = await get_i18n();
  return build_catalog_metadata(category, {
    country: customer_country,
    url_key: catalog_url_key,
    languages: await catalog_alternates("catalog", category.url_key ?? catalog_url_key, language),
  });
}

// Plain-text length above which the category description is expected to need the "Show more" link.
const LONG_DESCRIPTION = 160;

export default async function CatalogPage({ params, searchParams }: Props) {
  const { customer_country, ...route } = await params;
  const catalog_url_key = decode_param(route.catalog_url_key);
  const { page = "1", limit = "16", ...search_params } = await searchParams;

  // Same instance generateMetadata used; load_category keys its React cache on
  // the url_key string, so the two calls collapse to one fetch.
  const api_access_context = await get_server_api();

  // Category detail (breadcrumb `path`) for JSON-LD — cached, free here.
  const category = await load_category(api_access_context, {
    url_key: catalog_url_key,
  });
  const jsonLd = category
    ? build_catalog_jsonld(category, {
        country: customer_country,
        url_key: catalog_url_key,
      })
    : null;

  const options = {
    category: catalog_url_key,
    page,
    page_size: limit,
    ...listing_filters(search_params),
  };

  // Omnibus lines for the reduced prices on this page, in the server HTML. The
  // product list is the same cached request the catalog prefetch makes.
  const [, catalog_response] = await load_catalog(api_access_context, options);
  const discounted_skus: string[] = (catalog_response?.results ?? [])
    .filter((p: { price?: unknown }) => is_discounted(p.price))
    .map((p: { sku: string }) => p.sku);

  // Direct children with a name and url_key, for the pills under the title.
  const subcategories = ((category?.children ?? []) as { name?: string; url_key?: string }[])
    .filter((c): c is { name: string; url_key: string } => Boolean(c.name && c.url_key))
    .map((c) => ({ name: c.name, href: `/catalog/${c.url_key}` }));

  const header = category ? {
    title: category.name ?? "",
    trail: category_trail(category.breadcrumbs),
    description_html: category.description || null,
    description_long: (category.description ?? "").replace(/<[^>]*>/g, "").length > LONG_DESCRIPTION,
    subcategories,
  } : null;

  return (
    <PrefetchBoundary
      prefetches={[
        catalog_query(api_access_context, options),
        ...(discounted_skus.length
          ? [omnibus_prefetch(api_access_context, discounted_skus)]
          : []),
      ]}
    >
      {jsonLd && <JsonLd data={jsonLd} />}
      <ListingPageRuntime kind="category" options={options} header={header} category_name={category?.name}>
        <ListingPage />
      </ListingPageRuntime>
    </PrefetchBoundary>
  );
}
