// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Gift } from "lucide-react";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

// The "Gift" mark on a gift line (cart and checkout).
export function GiftBadge() {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1 self-start rounded bg-positive-surface px-1.5 py-0.5 text-xs font-medium text-positive">
      <Gift aria-hidden className="size-3" />
      {t("cart.gift_badge")}
    </span>
  );
}
