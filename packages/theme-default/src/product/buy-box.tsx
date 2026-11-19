// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { useProductPage } from "@entirius/storefront-sdk/product/page";
import { cn } from "@theme/lib/utils";
import { Button } from "@theme/ui/button";
import { QuantityStepper } from "@theme/ui/quantity-stepper";
import { WishlistButton } from "@theme/components/wishlist-button";

// Quantity, the add button and the wishlist; a sold-out SKU gets the back-in-stock form instead.
export function ProductBuyBox() {
  const { t } = useI18n();
  const { buy, blocks, product, wishlist_item, buy_area } = useProductPage();

  const controls =
    buy.mode === "stock_alert" ? (
      blocks.stock_alert
    ) : buy.mode === "choose_option" ? (
      <p data-stock-alert data-stock-alert-state="choose" className="min-w-0 flex-1 text-sm text-muted-foreground">
        {t("stockAlert.choose_option")}
      </p>
    ) : (
      <>
        {!buy.single_piece && (
          <>
            <span className="sr-only">{t("product.quantity")}</span>
            <QuantityStepper
              size="lg"
              value={buy.quantity}
              onChange={buy.set_quantity}
              max={buy.max}
              disabled={!buy.can_buy}
            />
          </>
        )}
        <Button size="lg" className="min-w-0 flex-1 px-4 md:px-6" disabled={!buy.can_buy} onClick={buy.add_to_cart}>
          {buy.label}
        </Button>
      </>
    );

  return (
    <div
      ref={buy_area}
      data-buy-area
      className={cn("flex gap-2 md:gap-3", buy.mode === "stock_alert" ? "items-start" : "items-center")}
    >
      {controls}
      <WishlistButton
        sku={product.sku}
        item={wishlist_item}
        variant="outline"
        size="icon-lg"
        className="shrink-0 rounded-chip"
      />
    </div>
  );
}
