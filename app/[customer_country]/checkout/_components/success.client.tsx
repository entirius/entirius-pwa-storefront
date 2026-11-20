// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { SITE_NAME } from "@/_CONFIG/app.config.json";
import type { CheckoutSuccessModel, ReceiptModel } from "@entirius/storefront-sdk/checkout";
import type { I18n } from "@entirius/storefront-sdk/i18n";
import { SuccessPage } from "@theme/checkout/success-page";
import { make_client_access } from "@/API/access/api.client-access";
import { useCartStore } from "@/stores/cart.store";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { transfer_details, useOrderReceipt, type OrderReceipt } from "./order-receipt";
import { payment_failed } from "./payment-return";

export function CheckoutSuccessClient() {
  const params = useSearchParams();
  const refs = params.getAll("ref");
  const failed = payment_failed(params);
  const torn_down = useRef(false);
  const i18n = useI18n();
  const { t } = i18n;
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

  const success: CheckoutSuccessModel = {
    message:
      refs.length > 1
        ? t("checkout.success_split", { count: refs.length, refs: refs.join(", ") })
        : refs[0]
          ? t("checkout.success_ref", { ref: refs[0] })
          : t("checkout.success_text"),
    payment_failed: failed,
    transfer_note: transfer_note || null,
    receipt: receipt ? receipt_model(receipt, i18n) : null,
    print: () => window.print(),
  };

  return <SuccessPage success={success} />;
}

// The stored snapshot → the theme's receipt: the amount, the date and the delivery price in the page language,
// the transfer details to copy.
function receipt_model(receipt: OrderReceipt, i18n: I18n): ReceiptModel {
  const { t, price, language } = i18n;
  const amount = receipt.total ? price(receipt.total, receipt.currency) : null;
  const { payment, shipping } = receipt;
  return {
    seller: SITE_NAME,
    numbers: receipt.refs.join(", "),
    date: new Date(receipt.placed_at).toLocaleString(language, { dateStyle: "long", timeStyle: "short" }),
    amount,
    payment: payment
      ? {
          name: payment.name,
          // The method text is whatever the shop wrote in the backend: plain text or HTML.
          description: payment.description
            ? { text: payment.description, html: /<[a-z][\s\S]*>/i.test(payment.description) }
            : null,
          copy_text:
            payment.is_transfer && amount
              ? transfer_details(receipt, amount, { amount: t("checkout.success_amount"), number: t("checkout.success_number") })
              : null,
        }
      : null,
    delivery: shipping
      ? {
          name: shipping.name,
          price:
            shipping.price != null
              ? { value: price(shipping.price, receipt.currency), free: parseFloat(shipping.price) === 0 }
              : null,
          point: shipping.point ?? null,
        }
      : null,
  };
}
