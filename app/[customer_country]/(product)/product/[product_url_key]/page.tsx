// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Suspense } from "react";
import type { Metadata } from "next";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { decode_param } from "@/lib/route-params";
import { product_query, load_product, variants_query } from "./api.query";
import { omnibus_prefetch, is_discounted } from "@/lib/omnibus/omnibus.query";
import { get_server_api } from "@/lib/seo/server-api";
import {
  build_product_metadata,
  build_product_jsonld,
  build_breadcrumbs_jsonld,
} from "@/lib/seo/build";
import { JsonLd } from "@/lib/seo/json-ld";
import { PROFILE_VIEWS, catalog_alternates } from "@/lib/seo/alternates";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { ProductClient } from "./_components/product.client";
import { RelatedSection } from "./related-products";
import {
  PageBreadcrumbs,
  category_trail,
} from "@/app/_components/layout/page-breadcrumbs";

interface Props {
  params: Promise<{ customer_country: string; product_url_key: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { customer_country, ...route } = await params;
  const product_url_key = decode_param(route.product_url_key);
  const api = await get_server_api();
  const [error, response] = await load_product(api, { product_url_key });
  const raw = response?.results?.[0];
  if (error || !raw) return { title: (await get_i18n()).t("product.title") };

  const { language } = await get_i18n();
  // The page's own profile reads its key from this response instead of asking the API again.
  const own_language = PROFILE_VIEWS.find((view) => view.profile === customer_country)?.language;
  const own_key = own_language ? (raw.url_keys?.[own_language] ?? null) : undefined;
  return build_product_metadata(raw, {
    country: customer_country,
    url_key: product_url_key,
    languages: await catalog_alternates("product", raw.url_key ?? product_url_key, language, customer_country, own_key),
  });
}

export default async function ProductPage({ params }: Props) {
  const { customer_country, ...route } = await params;
  const product_url_key = decode_param(route.product_url_key);
  const api = await get_server_api();

  // Raw product (RAW price/media, not the display-normalized shape) for JSON-LD.
  // load_product keys its React cache on the url_key string, so this shares
  // generateMetadata's fetch even though the options literal differs.
  const [, response] = await load_product(api, { product_url_key });
  const raw = response?.results?.[0];
  const ctx = { country: customer_country, url_key: product_url_key };
  // A product can sit in several categories; the trail follows the first one.
  const category_path = raw?.categories?.[0]?.path;
  const product_ld = raw ? build_product_jsonld(raw, ctx) : null;
  const crumbs_ld = raw
    ? build_breadcrumbs_jsonld(category_path, ctx, {
        name: raw.name,
        url: product_ld?.offers?.url,
      })
    : null;
  const jsonLd = [product_ld, crumbs_ld].filter((d): d is object => d !== null);

  return (
    <PrefetchBoundary
      prefetches={[
        product_query(api, { product_url_key }, response),
        variants_query(api, { product_url_key }),
        ...(raw && is_discounted(raw.price)
          ? [omnibus_prefetch(api, [raw.sku])]
          : []),
      ]}
    >
      {jsonLd.length > 0 && <JsonLd data={jsonLd} />}
      {raw && (
        <PageBreadcrumbs
          trail={[...category_trail(category_path), { name: raw.name }]}
        />
      )}
      <ProductClient
        product_url_key={product_url_key}
        related={
          <Suspense fallback={null}>
            <RelatedSection product_url_key={product_url_key} />
          </Suspense>
        }
      />
    </PrefetchBoundary>
  );
}
