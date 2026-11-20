// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { useProductPage } from "@entirius/storefront-sdk/product/page";
import { ProductPrice } from "@theme/components/product-price";

// The headline price: "from" while no variant is chosen, the lowest 30-day price next to a reduction, VAT included.
export function ProductPriceBlock() {
  const { t } = useI18n();
  const { price, variants, purchasable } = useProductPage();

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {variants ? (
        <div className="flex items-baseline gap-1.5">
          {price.from && <span className="text-sm text-muted-foreground">{t("product.price_from")}</span>}
          <ProductPrice price={price.value} large />
        </div>
      ) : (
        <ProductPrice price={price.value} sku={price.omnibus_sku ?? undefined} large />
      )}
      {purchasable && <span className="text-xs text-muted-foreground">{t("product.incl_vat")}</span>}
    </div>
  );
}
