// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { SITE_NAME } from "@/_CONFIG/app.config.json";
import { Button } from "@/components/ui/button";
import { SanitizeHTML } from "@/components/ui/sanitize-html";
import { LinkDynamic } from "@/lib/link-dynamic";
import { make_client_access } from "@/API/access/api.client-access";
import { useCartStore } from "@/stores/cart.store";
import { useI18n } from "@/providers/i18n.provider";
import { transfer_details, useOrderReceipt, type OrderReceipt } from "./order-receipt";

export function CheckoutSuccessClient() {
  const params = useSearchParams();
  const refs = params.getAll("ref");
  const payment_failed = params.get("payment") === "failed";
  const torn_down = useRef(false);
  const { t, language } = useI18n();
  const receipt = useOrderReceipt(refs);
  const transfer_note = receipt?.payment?.is_transfer ? t("checkout.transfer_next").trim() : "";

  // The order is placed — tear down the cart here (not before navigation) so the
  // checkout page never flashes its empty-cart state on the way out.
  useEffect(() => {
    if (torn_down.current) return;
    torn_down.current = true;
    useCartStore.getState().clear();
    make_client_access().delete?.("cid");
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-3 text-center text-2xl">{t("checkout.success_title")}</h1>
      <p className="text-muted-foreground mb-6 text-center">
        {refs.length > 1
          ? t("checkout.success_split", { count: refs.length, refs: refs.join(", ") })
          : refs[0]
            ? t("checkout.success_ref", { ref: refs[0] })
            : t("checkout.success_text")}
      </p>
      {payment_failed && (
        <p className="mb-6 rounded-md border border-destructive/50 bg-destructive-surface px-3 py-2 text-sm text-destructive">
          {t("checkout.payment_start_failed")}
        </p>
      )}
      {transfer_note && (
        <p data-transfer-next className="mb-6 rounded-lg border bg-muted p-4 text-sm">
          {transfer_note}
        </p>
      )}

      {receipt && (
        <Receipt
          receipt={receipt}
          date={new Date(receipt.placed_at).toLocaleString(language, { dateStyle: "long", timeStyle: "short" })}
        />
      )}

      <div data-print-hide className="flex flex-wrap justify-center gap-3">
        {receipt && (
          <Button onClick={() => window.print()}>{t("checkout.print_receipt")}</Button>
        )}
        <Button asChild variant="outline">
          <LinkDynamic href="/">{t("common.continue_shopping")}</LinkDynamic>
        </Button>
      </div>
    </div>
  );
}

function Receipt({ receipt, date }: { receipt: OrderReceipt; date: string }) {
  const { t, price } = useI18n();
  const amount = receipt.total ? price(receipt.total, receipt.currency) : null;
  return (
    <section data-order-receipt className="mb-6">
      <h2 className="mb-2 text-lg">{t("checkout.receipt_title")}</h2>
      <dl className="divide-y rounded-lg border text-sm">
        <Row label={t("checkout.receipt_seller")}>
          <span className="font-medium">{SITE_NAME}</span>
        </Row>
        <Row label={t("checkout.success_number")}>
          <span className="font-medium">{receipt.refs.join(", ")}</span>
        </Row>
        <Row label={t("checkout.receipt_date")}>
          <span className="font-medium">{date}</span>
        </Row>
        {amount && (
          <Row label={t("checkout.success_amount")}>
            <span className="text-base font-semibold tabular-nums">{amount}</span>
          </Row>
        )}
        {receipt.payment && (
          <Row label={t("checkout.success_payment")}>
            <span className="font-medium">{receipt.payment.name}</span>
            {receipt.payment.description && <Description text={receipt.payment.description} />}
            {receipt.payment.is_transfer && amount && (
              <CopyDetails
                text={transfer_details(receipt, amount, {
                  amount: t("checkout.success_amount"),
                  number: t("checkout.success_number"),
                })}
              />
            )}
          </Row>
        )}
        {receipt.shipping && (
          <Row label={t("checkout.success_delivery")}>
            <span className="font-medium">
              {receipt.shipping.name}
              {receipt.shipping.price != null &&
                ` · ${
                  parseFloat(receipt.shipping.price) === 0
                    ? t("common.free")
                    : price(receipt.shipping.price, receipt.currency)
                }`}
            </span>
          </Row>
        )}
      </dl>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
      <dt className="text-muted-foreground sm:w-40 sm:shrink-0">{label}</dt>
      <dd className="flex min-w-0 flex-1 flex-col gap-1">{children}</dd>
    </div>
  );
}

// The method text is whatever the shop wrote in the backend: plain text or HTML.
function Description({ text }: { text: string }) {
  if (/<[a-z][\s\S]*>/i.test(text)) return <SanitizeHTML html={text} />;
  return <span className="whitespace-pre-line">{text}</span>;
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
