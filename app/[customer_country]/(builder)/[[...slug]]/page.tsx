import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { create_api } from "@/API/api.context";
import { make_server_access } from "@/API/access/api.server-access";
import {
  load_static_page,
  static_page_query,
  cms_products_query,
} from "./api.query";
import { aggregate_url_keys } from "./_components/cms-product-aggregation.config";
import { BuilderClient } from "./_components/builder.client";

interface Props {
  params: Promise<{
    customer_country: string;
    slug?: string[];
  }>;
}

// One api instance per request, shared by generateMetadata and the page so the page is fetched once.
const get_api = cache(async () => create_api(await make_server_access()));

// Not CMS pages: slugs with dots are browser-internal paths (e.g. Chrome DevTools .json).
const is_page_route = (slug?: string[]) => !slug?.some((s) => s.includes("."));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!is_page_route(slug)) return {};

  const [, cms_data] = await load_static_page(await get_api(), {
    routes: slug?.[0] ? [slug[0]] : ["home"],
  });
  const meta = cms_data?.data?.[0]?.meta;
  return {
    ...(meta?.title && { title: meta.title }),
    ...(meta?.description && { description: meta.description }),
  };
}

export default async function BuilderPage({ params }: Props) {
  const { slug } = await params;

  if (!is_page_route(slug)) notFound();

  const routes = slug?.[0] ? [slug[0]] : ["home"];

  const api = await get_api();
  // ------------------------------------------------------------
  // Fetch CMS document first to extract product url_keys for batch prefetch.
  // load_static_page is React.cache()-wrapped — the second call inside
  // PrefetchBoundary.queryFn returns from cache with no additional request.
  // ------------------------------------------------------------
  const options = { routes };
  const [, cms_data] = await load_static_page(api, options);
  const document = cms_data?.data?.[0] ?? null;

  if (!document) notFound();

  const url_keys = aggregate_url_keys(document.content);

  const prefetches = [
    static_page_query(api, options),
    ...(url_keys.length ? [cms_products_query(api, url_keys)] : []),
  ];

  return (
    <PrefetchBoundary prefetches={prefetches}>
      <BuilderClient routes={routes} />
    </PrefetchBoundary>
  );
}
