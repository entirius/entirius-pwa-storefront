import { Metadata } from "next";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { catalog_query } from "./api.query";
import { create_api } from "@/API/api.context";
import { make_server_access } from "@/API/access/api.server-access";
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
  // const { catalog_url_key } = await params;

  // const options = {
  //   category_url_key: catalog_url_key,
  //   limit: 16,
  //   page: 1,
  // };

  // const [, data] = await load_catalog(catalog_url_key);

  // return {
  //   title: (data as any)?.name ?? "Catalog",
  // };
  return {
    title: "Catalog",
  };
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { catalog_url_key } = await params;
  const { page = "1", limit = "16", ...search_params } = await searchParams;

  const api_access_context = create_api(await make_server_access());

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
      <ListingClient options={options} />
    </PrefetchBoundary>
  );
}
