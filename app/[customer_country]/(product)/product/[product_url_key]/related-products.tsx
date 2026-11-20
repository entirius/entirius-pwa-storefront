// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { omnibus_prefetch, is_discounted } from "@/lib/omnibus/omnibus.query";
import { get_server_api } from "@/lib/seo/server-api";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { NORM_PRODUCTS_DATA, type RawProduct } from "@/utils/NORMALIZERS/product.normalizer";
import { RelatedProducts as RelatedProductsPart } from "@theme/product/related-products";
import { load_related } from "./related";

const strip_html = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// Only what the tile reads goes to the client: the first picture and a short text, not the full record.
function tile_data(raw: RawProduct) {
  const [product] = NORM_PRODUCTS_DATA([raw]);
  const text = raw.short_description || strip_html(raw.description ?? "");
  return {
    sku: product.sku,
    name: product.name,
    url_key: product.url_key,
    price: product.price,
    percent_off: product.percent_off,
    badges: product.badges,
    product_type: product.product_type,
    on_stock: product.on_stock,
    media: product.media.slice(0, 1),
    description: text.slice(0, 200),
  };
}

// The section's look is the theme's (@theme/product/related-products): server-rendered, plain crawlable links.
export async function RelatedProducts({ items }: { items: RawProduct[] }) {
  if (!items.length) return null;
  const { t } = await get_i18n();
  return <RelatedProductsPart t={t} products={items.map(tile_data)} />;
}

// The section as the product page streams it: under <Suspense>, so the product does not wait for its similar
// products. Renders nothing when there are none.
export async function RelatedSection({ product_url_key }: { product_url_key: string }) {
  const api = await get_server_api();
  const items = await load_related(api, product_url_key);
  if (!items.length) return null;
  const discounted = items.filter((p) => is_discounted(p.price)).map((p) => p.sku);
  return (
    <PrefetchBoundary prefetches={discounted.length ? [omnibus_prefetch(api, discounted)] : []}>
      <RelatedProducts items={items} />
    </PrefetchBoundary>
  );
}
