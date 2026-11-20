// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { RelatedProductsProps } from "@entirius/storefront-sdk/product/card";
import { cn } from "@theme/lib/utils";
import { ProductCard } from "@theme/components/product-card";

// Similar products in stock, a server part with plain crawlable links. `@theme/product/related` wraps it in an
// element with `group/related` and `data-stock`: on a sold-out product it sits under the buy area in the narrow column
// (a line of explanation, 4 tiles); otherwise it closes the page (4 tiles, 8 from `lg`).
export function RelatedProducts({ t, products }: RelatedProductsProps) {
  if (!products.length) return null;
  return (
    <section
      id="related-products"
      data-related-products
      className="flex scroll-mt-24 flex-col gap-3 md:scroll-mt-32 group-data-[stock=in]/related:md:gap-5"
    >
      <h2 className="text-xl group-data-[stock=in]/related:text-2xl group-data-[stock=in]/related:md:text-3xl">
        {t("product.related")}
      </h2>
      <p data-related-lead className="hidden text-sm text-muted-foreground group-data-[stock=out]/related:block">
        {t("product.related_sold")}
      </p>
      <div
        data-product-grid
        className="grid grid-cols-2 gap-3 group-data-[stock=in]/related:md:grid-cols-4 group-data-[stock=in]/related:lg:gap-4"
      >
        {products.map((product, i) => (
          <div key={product.sku} className={cn("min-w-0", i >= 4 && "hidden group-data-[stock=in]/related:lg:block")}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
