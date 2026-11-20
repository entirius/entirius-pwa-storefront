// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import type { ReceiptModel } from "@entirius/storefront-sdk/checkout";
import { RichText } from "@entirius/storefront-sdk/components/rich-text";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";

// The receipt after the order: seller, numbers, date, amount, payment (with the transfer details to copy) and
// delivery. `data-order-receipt` is what the print styles keep on paper.
export function OrderReceipt({ receipt }: { receipt: ReceiptModel }) {
  const { t } = useI18n();
  const { payment, delivery } = receipt;
  return (
    <section data-order-receipt className="mb-6">
      <h2 className="mb-2 text-lg">{t("checkout.receipt_title")}</h2>
      <dl className="divide-y rounded-lg border text-sm">
        <Row label={t("checkout.receipt_seller")}>
          <span className="font-medium">{receipt.seller}</span>
        </Row>
        <Row label={t("checkout.success_number")}>
          <span className="font-medium">{receipt.numbers}</span>
        </Row>
        <Row label={t("checkout.receipt_date")}>
          <span className="font-medium">{receipt.date}</span>
        </Row>
        {receipt.amount && (
          <Row label={t("checkout.success_amount")}>
            <span className="text-base font-semibold tabular-nums">{receipt.amount}</span>
          </Row>
        )}
        {payment && (
          <Row label={t("checkout.success_payment")}>
            <span className="font-medium">{payment.name}</span>
            {payment.description &&
              (payment.description.html ? (
                <RichText html={payment.description.text} />
              ) : (
                <span className="whitespace-pre-line">{payment.description.text}</span>
              ))}
            {payment.copy_text && <CopyDetails text={payment.copy_text} />}
          </Row>
        )}
        {delivery && (
          <Row label={t("checkout.success_delivery")}>
            <span className="font-medium">
              {delivery.name}
              {delivery.price && ` · ${delivery.price.free ? t("common.free") : delivery.price.value}`}
            </span>
            {delivery.point && <span className="block text-muted-foreground">{delivery.point}</span>}
          </Row>
        )}
      </dl>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
      <dt className="text-muted-foreground sm:w-40 sm:shrink-0">{label}</dt>
      <dd className="flex min-w-0 flex-1 flex-col gap-1">{children}</dd>
    </div>
  );
}

function CopyDetails({ text }: { text: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button type="button" variant="outline" size="sm" className="mt-1 w-fit" data-copy-details data-print-hide onClick={copy}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? t("checkout.copied") : t("checkout.copy_details")}
    </Button>
  );
}
