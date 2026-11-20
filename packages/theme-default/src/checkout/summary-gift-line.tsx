// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { GiftLineModel } from "@entirius/storefront-sdk/cart";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { ProductThumb } from "@theme/components/product-thumb";
import { GiftBadge } from "@theme/order/gift-badge";

// A gift line of checkout's summary: read-only, like the other summary lines.
export function SummaryGiftLine({ line }: { line: GiftLineModel }) {
  const { t } = useI18n();
  return (
    <div className="flex gap-3 py-3">
      <ProductThumb src={line.picture} alt={line.name} sizes="64px" className="w-16" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-medium">{line.name}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{t("checkout.quantity", { count: line.quantity })}</span>
          <span>{line.unit}</span>
        </div>
        <GiftBadge />
      </div>
      <span className="text-sm font-medium tabular-nums">{line.total}</span>
    </div>
  );
}
