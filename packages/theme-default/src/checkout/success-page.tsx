// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { CheckoutSuccessModel } from "@entirius/storefront-sdk/checkout";
import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Alert } from "@theme/ui/alert";
import { Button } from "@theme/ui/button";
import { OrderReceipt } from "@theme/checkout/order-receipt";

// The page after the order: thanks and the number, a failed payment start, what to do for a transfer, the receipt,
// printing it and the way back to the shop. `data-print-hide` leaves the buttons off paper.
export function SuccessPage({ success }: { success: CheckoutSuccessModel }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-3 text-center text-2xl">{t("checkout.success_title")}</h1>
      <p className="mb-6 text-center text-muted-foreground">{success.message}</p>
      {success.payment_failed && <Alert className="mb-6">{t("checkout.payment_start_failed")}</Alert>}
      {success.transfer_note && (
        <p data-transfer-next className="mb-6 rounded-lg border bg-muted p-4 text-sm">
          {success.transfer_note}
        </p>
      )}
      {success.receipt && <OrderReceipt receipt={success.receipt} />}
      <div data-print-hide className="flex flex-wrap justify-center gap-3">
        {success.receipt && <Button onClick={success.print}>{t("checkout.print_receipt")}</Button>}
        <Button asChild variant="outline">
          <Link href="/">{t("common.continue_shopping")}</Link>
        </Button>
      </div>
    </div>
  );
}
