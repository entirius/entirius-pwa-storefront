// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type * as React from "react";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";
import { FormHeading } from "@theme/ui/form";

// The order summary's frame on the cart page and in checkout: a titled card around the totals and the actions.
export function OrderSummaryCard({ className, children }: { className?: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <aside data-order-totals aria-label={t("checkout.summary")} className={cn("surface-outline flex flex-col gap-4", className)}>
      <FormHeading>{t("checkout.summary")}</FormHeading>
      {children}
    </aside>
  );
}
