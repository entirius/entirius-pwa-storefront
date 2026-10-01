import { Metadata } from "next";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { catalog_query, load_category } from "./api.query";
import { get_server_api } from "@/lib/seo/server-api";
import { build_catalog_metadata, build_catalog_jsonld } from "@/lib/seo/build";
import { JsonLd } from "@/lib/seo/json-ld";
import { ListingClient } from "./_components/listing.client";

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
  const { customer_country, catalog_url_key } = await params;
  const api = await get_server_api();
  const category = await load_category(api, { url_key: catalog_url_key });
  if (!category) return { title: "Catalog" };

  return build_catalog_metadata(category, {
    country: customer_country,
    url_key: catalog_url_key,
  });
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { customer_country, catalog_url_key } = await params;
  const { page = "1", limit = "16", ...search_params } = await searchParams;

  // Shared with generateMetadata so load_category dedupes to one fetch.
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

  // q_/s_/r_ params are passed to the backend as-is (prefix kept) — the v2
  // backend parses them directly, so no strip/nest is needed anymore.
  const filters = Object.fromEntries(
    Object.entries(search_params).filter(([key]) =>
      ["q_", "s_", "r_"].some((p) => key.startsWith(p)),
    ),
  );

  const options = {
    category: catalog_url_key,
    page,
    page_size: limit,
    ...filters,
  };

  return (
    <PrefetchBoundary
      prefetches={[
        catalog_query(api_access_context, options),
        // products_query(api_access_context, options),
      ]}
    >
      {jsonLd && <JsonLd data={jsonLd} />}
      <ListingClient options={options} />
    </PrefetchBoundary>
  );
}
