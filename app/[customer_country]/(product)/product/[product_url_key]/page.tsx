import type { Metadata } from "next";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { product_query, load_product } from "./api.query";
import { get_server_api } from "@/lib/seo/server-api";
import { build_product_metadata, build_product_jsonld } from "@/lib/seo/build";
import { JsonLd } from "@/lib/seo/json-ld";
import { ProductClient } from "./_components/product.client";

interface Props {
  params: Promise<{ customer_country: string; product_url_key: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { customer_country, product_url_key } = await params;
  const api = await get_server_api();
  const [error, response] = await load_product(api, { product_url_key });
  const raw = response?.results?.[0];
  if (error || !raw) return { title: "Product" };

  return build_product_metadata(raw, {
    country: customer_country,
    url_key: product_url_key,
  });
}

export default async function ProductPage({ params }: Props) {
  const { customer_country, product_url_key } = await params;
  const api = await get_server_api();

  // Raw product (RAW price/media, not the display-normalized shape) for JSON-LD.
  // load_product keys its React cache on the url_key string, so this shares
  // generateMetadata's fetch even though the options literal differs.
  const [, response] = await load_product(api, { product_url_key });
  const raw = response?.results?.[0];
  const jsonLd = raw
    ? build_product_jsonld(raw, {
        country: customer_country,
        url_key: product_url_key,
      })
    : null;

  return (
    <PrefetchBoundary
      prefetches={[product_query(api, { product_url_key }, response)]}
    >
      {jsonLd && <JsonLd data={jsonLd} />}
      <ProductClient product_url_key={product_url_key} />
    </PrefetchBoundary>
  );
}
