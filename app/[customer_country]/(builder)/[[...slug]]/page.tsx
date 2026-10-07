// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { notFound } from "next/navigation";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { create_api } from "@/API/api.context";
import { make_server_access } from "@/API/access/api.server-access";
import {
  load_static_page,
  static_page_query,
  cms_products_query,
  cms_products_by_sku_query,
  cms_category_products_query,
  load_products_by_sku,
  load_category_products,
} from "./api.query";
import { omnibus_prefetch, is_discounted } from "@/lib/omnibus/omnibus.query";
import {
  aggregate_categories,
  aggregate_skus,
  aggregate_url_keys,
} from "./_components/cms-product-aggregation.config";
import { BuilderClient } from "./_components/builder.client";

interface Props {
  params: Promise<{
    customer_country: string;
    slug?: string[];
  }>;
}

export default async function BuilderPage({ params }: Props) {
  const { slug } = await params;

  // Guard: slugs with dots are browser-internal paths (e.g. Chrome DevTools .json), not CMS pages
  if (slug?.some((s) => s.includes("."))) notFound();

  const routes = slug?.[0] ? [slug[0]] : ["home"];

  const api = create_api(await make_server_access());
  // ------------------------------------------------------------
  // Fetch CMS document first to extract product url_keys for batch prefetch.
  // load_static_page keys its React cache on the joined routes string, so the
  // second call inside PrefetchBoundary.queryFn costs no additional request.
  // ------------------------------------------------------------
  const options = { routes };
  const [, cms_data] = await load_static_page(api, options);
  const document = cms_data?.data?.[0] ?? null;

  if (!document) notFound();

  const url_keys = aggregate_url_keys(document.content);
  const skus = aggregate_skus(document.content);
  const categories = aggregate_categories(document.content);

  // Omnibus lines for the reduced prices in CMS product sections, in the server
  // HTML like the catalog's. The product requests are the cached ones the
  // prefetches below make; a failed one simply leaves its section to the client.
  const cms_products = await Promise.all([
    skus.length
      ? load_products_by_sku(api, skus).then((r) => r?.results ?? []).catch(() => [])
      : [],
    ...categories.map((category) => load_category_products(api, category).catch(() => [])),
  ]);
  const discounted_skus = cms_products
    .flat()
    .filter((p) => is_discounted((p as { price?: unknown }).price))
    .map((p) => (p as { sku: string }).sku);

  const prefetches = [
    static_page_query(api, options),
    ...(url_keys.length ? [cms_products_query(api, url_keys)] : []),
    ...(skus.length ? [cms_products_by_sku_query(api, skus)] : []),
    ...categories.map((category) => cms_category_products_query(api, category)),
    ...(discounted_skus.length ? [omnibus_prefetch(api, discounted_skus)] : []),
  ];

  return (
    <PrefetchBoundary prefetches={prefetches}>
      <BuilderClient routes={routes} />
    </PrefetchBoundary>
  );
}
