// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cn } from "@/lib/utils";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { omnibus_prefetch, is_discounted } from "@/lib/omnibus/omnibus.query";
import { get_server_api } from "@/lib/seo/server-api";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { NORM_PRODUCTS_DATA, type RawProduct } from "@/utils/NORMALIZERS/product.normalizer";
import { ProductTile } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/product-tile.client";
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
    purchasable: product.purchasable,
    on_stock: product.on_stock,
    media: product.media.slice(0, 1),
    description: text.slice(0, 200),
  };
}

// Server-rendered, so the tiles are plain crawlable links. The product page wraps the section in an element
// with `group/related` and `data-stock`: on a sold-out product it sits right under the buy area in the narrow
// column (lead text, 4 tiles); otherwise it closes the page (4 tiles, 8 from `lg`).
export async function RelatedProducts({ items }: { items: RawProduct[] }) {
  if (!items.length) return null;
  const { t } = await get_i18n();

  return (
    <section id="related-products" data-related-products className="flex scroll-mt-24 md:scroll-mt-32 flex-col gap-3 group-data-[stock=in]/related:md:gap-5">
      <h2 className="text-xl group-data-[stock=in]/related:text-2xl group-data-[stock=in]/related:md:text-3xl">
        {t("product.related")}
      </h2>
      <p data-related-lead className="hidden text-sm text-muted-foreground group-data-[stock=out]/related:block">
        {t("product.related_sold")}
      </p>
      <div className="grid grid-cols-2 gap-3 group-data-[stock=in]/related:md:grid-cols-4 group-data-[stock=in]/related:lg:gap-4">
        {items.map((raw, i) => (
          <div
            key={raw.sku}
            className={cn(
              "min-w-0",
              i >= 4 && "hidden group-data-[stock=in]/related:lg:block",
            )}
          >
            <ProductTile product={tile_data(raw)} />
          </div>
        ))}
      </div>
    </section>
  );
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
