// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useCartPage } from "@entirius/storefront-sdk/cart/page";
import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";

// Phones and tablets: the total and the way to checkout always in reach, fixed at the bottom.
export function CartBar() {
  const { t } = useI18n();
  const { total } = useCartPage();
  return (
    <div className="fixed inset-x-0 bottom-0 z-sticky flex items-center gap-3 border-t border-border bg-card px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{t("cart.total_incl_vat")}</p>
        <p className="text-base font-semibold tabular-nums">{total}</p>
      </div>
      <Button size="lg" className="h-12 px-6" asChild>
        <Link href="/checkout">{t("cart.go_to_checkout")}</Link>
      </Button>
    </div>
  );
}
