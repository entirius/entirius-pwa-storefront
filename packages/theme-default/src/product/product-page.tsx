// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { useProductPage } from "@entirius/storefront-sdk/product/page";
import { cn } from "@theme/lib/utils";
import { ProductGallery } from "@theme/product/gallery";
import { ProductHeader } from "@theme/product/header";
import { ProductPriceBlock } from "@theme/product/price";
import { ProductStockStatus } from "@theme/product/stock-status";
import { ProductVariantPicker } from "@theme/product/variant-picker";
import { ProductBuyBox } from "@theme/product/buy-box";
import { ProductDescription } from "@theme/product/description";
import { ProductSpecs } from "@theme/product/specs";
import { ProductStories } from "@theme/product/stories";
import { ProductRelated } from "@theme/product/related";
import { ProductStickyBuyBar } from "@theme/product/sticky-buy-bar";

// The product page: the default arrangement of its parts. Every part reads the page from useProductPage(), so a
// theme replaces this file to move, drop or add parts, or one part's file to change only that part.
export function ProductPage() {
  const { t } = useI18n();
  const page = useProductPage();

  return (
    <div
      // Room under the page for the fixed buy bar on phones.
      className={cn("group/product flex flex-col gap-10", page.purchasable && "pb-16 md:pb-0")}
      data-product-page
      data-stock={page.stock.known ? (page.stock.in_stock ? "in" : "out") : undefined}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
        <ProductGallery />

        <section aria-label={t("product.details")} className="surface flex flex-col gap-8">
          {/* Meta: who, what, which. */}
          <ProductHeader />

          {/* Price and whether it can be bought now. */}
          <div className="flex flex-col gap-3">
            <ProductPriceBlock />
            <ProductStockStatus />
          </div>

          {/* Actions. */}
          <div className="flex flex-col gap-3">
            <ProductVariantPicker />
            <ProductBuyBox />
            {page.blocks.notify_similar}
            {page.blocks.enquiry}
          </div>

          <ProductDescription />
          <ProductSpecs />
          {page.stock.sold && <ProductRelated />}
        </section>
      </div>

      <ProductStories />
      {!page.stock.sold && <ProductRelated />}
      <ProductStickyBuyBar />
    </div>
  );
}
