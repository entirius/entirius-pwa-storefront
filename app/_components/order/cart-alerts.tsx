// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n.provider";
import { cart_error_texts } from "@/utils/cart-errors";
import type { Cart } from "@/utils/NORMALIZERS/cart.normalizer";

// The cart's problems above the cart page list and the checkout steps: a failed sync, then
// every line the backend refuses (out of stock, over the limit...).
export function CartAlerts({
  backend,
  sync_failed,
  sync_message,
  className,
}: {
  backend: Cart | null | undefined;
  sync_failed: boolean;
  sync_message: string;
  className?: string;
}) {
  const { t } = useI18n();
  const problems =
    backend && backend.validation_status !== "valid" ? cart_error_texts(backend.errors, t) : [];
  if (!sync_failed && problems.length === 0) return null;
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {sync_failed && <Alert>{sync_message}</Alert>}
      {problems.length > 0 && (
        <Alert>
          <p className="font-medium">{t("checkout.items_attention")}</p>
          <ul className="mt-1 list-disc pl-5">
            {problems.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  );
}
