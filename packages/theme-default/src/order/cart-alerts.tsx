// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { CartAlertsModel } from "@entirius/storefront-sdk/cart";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";
import { Alert } from "@theme/ui/alert";

// The cart's problems (the cart page and checkout): the failed sync, then the lines the backend refuses.
export function CartAlerts({ alerts, className }: { alerts: CartAlertsModel; className?: string }) {
  const { t } = useI18n();
  if (!alerts.sync && alerts.problems.length === 0) return null;
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {alerts.sync && <Alert>{alerts.sync}</Alert>}
      {alerts.problems.length > 0 && (
        <Alert>
          <p className="font-medium">{t("checkout.items_attention")}</p>
          <ul className="mt-1 list-disc pl-5">
            {alerts.problems.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  );
}
