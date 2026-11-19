// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useCartPage } from "@entirius/storefront-sdk/cart/page";
import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";
import { OrderSummaryCard } from "@theme/order/summary-card";

// The summary column: the discount code, the totals and the way to checkout (desktop; phones have the bar).
export function CartSummary() {
  const { t } = useI18n();
  const { blocks } = useCartPage();
  return (
    <OrderSummaryCard className="lg:sticky lg:top-24">
      <div className="border-t pt-4">{blocks.discount_code}</div>
      <div className="border-t pt-4">{blocks.totals}</div>
      <Button size="lg" className="hidden h-12 text-base lg:inline-flex" asChild>
        <Link href="/checkout">{t("cart.go_to_checkout")}</Link>
      </Button>
    </OrderSummaryCard>
  );
}
