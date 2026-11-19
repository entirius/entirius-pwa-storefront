// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { useProductPage } from "@entirius/storefront-sdk/product/page";
import { cn } from "@theme/lib/utils";
import { ProductBadges } from "@theme/components/product-badges";

// Long names step the title down one size, so a two-line name does not dominate the column.
const LONG_TITLE = 40;
const title_size = (name: string) =>
  name.length > LONG_TITLE ? "text-xl md:text-2xl" : "text-2xl md:text-3xl";

// Who, what, which: brands, labels, the name, the key attributes and the SKU.
export function ProductHeader() {
  const { t } = useI18n();
  const { product } = useProductPage();

  return (
    <div className="flex flex-col gap-3">
      {product.brands.length > 0 && <p className="text-xs text-muted-foreground">{product.brands.join(", ")}</p>}
      <ProductBadges badges={product.badges} percent_off={product.percent_off} />
      <h1 className={cn("text-balance leading-tight", title_size(product.name))}>{product.name}</h1>
      {product.key_facts && (
        <p data-key-facts className="text-sm text-muted-foreground">
          {product.key_facts}
        </p>
      )}
      <p data-product-sku className="text-xs text-muted-foreground">
        {t("product.sku_line", { sku: product.sku })}
      </p>
    </div>
  );
}
