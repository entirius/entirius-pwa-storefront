// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { useProductPage } from "@entirius/storefront-sdk/product/page";

// In stock or not, once the real-time stock has answered.
export function ProductStockStatus() {
  const { t } = useI18n();
  const { stock } = useProductPage();
  if (!stock.show_status) return null;

  return (
    <p className="flex items-center gap-2 text-sm">
      <span
        aria-hidden
        className={stock.in_stock ? "size-2 rounded-full bg-positive" : "size-2 rounded-full bg-muted-foreground"}
      />
      {stock.in_stock ? t("product.in_stock") : t("product.out_of_stock")}
    </p>
  );
}
