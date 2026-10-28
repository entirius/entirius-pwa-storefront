// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { PageLoading } from "@/components/ui/spinner";
import { NORM_CART } from "@/utils/NORMALIZERS/cart.normalizer";
import type { PlacedOrder } from "@/utils/NORMALIZERS/order.normalizer";
import { cart_to_address_form } from "@/utils/validation/address.schema";
import { useCartSync } from "@/stores/use-cart-sync";
import { useI18n } from "@/providers/i18n.provider";
import { CheckoutStepper, type CheckoutStep } from "./checkout-stepper";
import { CheckoutSummary } from "./checkout-summary";
import { CartAlerts } from "@/app/_components/order/cart-alerts";
import { EmptyCart, OrderPageHeader } from "@/app/_components/order/page-header";
import { AddressStep } from "./address-step";
import { ShippingStep } from "./shipping-step";
import { PaymentStep } from "./payment-step";
import { ReviewStep } from "./review-step";
import { order_refs } from "./order-receipt";


export function CheckoutClient() {
  const { mounted, backend, isFetching, error, items, currency } = useCartSync();
  const entries = Object.entries(items);
  const router = useRouter();
  const country = useParams()?.customer_country as string | undefined;
  const { t } = useI18n();

  const query_client = useQueryClient();

  const [step, setStep] = useState<CheckoutStep>("address");
  const [completed, setCompleted] = useState<Set<CheckoutStep>>(new Set());
  const cart = backend ?? null;
  // An address/shipping/payment save answers with the whole cart: it goes into every
  // cart query, as a discount code does, instead of a refetch (another items PATCH).
  const save_cart = (resp: unknown) => query_client.setQueriesData({ queryKey: ["cart"] }, NORM_CART(resp));

  // The stepper also shows as done what the cart already has filled in (no auto-advance).
  const done = new Set(completed);
  if (cart?.billing_address) done.add("address");
  if (cart?.shipping_method) done.add("shipping");
  if (cart?.payment_method) done.add("payment");

  if (!mounted) {
    return (
      <PageLoading />
    );
  }

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-5xl py-4">
        <OrderPageHeader title={t("checkout.title")} />
        <EmptyCart message={t("checkout.empty")} action={t("common.continue_shopping")} />
      </div>
    );
  }

  const cart_ready = !!backend?.cart_id;

  const onAddressSaved = (resp: unknown) => {
    save_cart(resp);
    setCompleted((c) => new Set(c).add("address"));
    setStep("shipping");
  };

  const onShippingSaved = (resp: unknown) => {
    save_cart(resp);
    setCompleted((c) => new Set(c).add("shipping"));
    setStep("payment");
  };

  const onPaymentSaved = (resp: unknown) => {
    save_cart(resp);
    setCompleted((c) => new Set(c).add("payment"));
    setStep("review");
  };

  // Order placed (no gateway redirect) → go to the dedicated success route, which
  // owns cart teardown so this page never flashes its empty-cart state on the way out.
  // A split order passes every part's number (`ref` repeated).
  const onPlaced = (order: PlacedOrder) => {
    const base =
      !country || country === "default"
        ? "/checkout/success"
        : `/${country}/checkout/success`;
    const params = new URLSearchParams();
    for (const ref of order_refs(order)) params.append("ref", ref);
    if (order.payment_error) params.set("payment", "failed");
    const query = params.toString();
    router.push(query ? `${base}?${query}` : base);
  };

  return (
    <div className="mx-auto max-w-5xl py-4">
      <OrderPageHeader title={t("checkout.title")} busy={isFetching} />

      <CheckoutStepper
        current={step}
        completed={done}
        onStep={setStep}
      />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <CartAlerts
            className="mb-4"
            backend={backend}
            sync_failed={!!error}
            sync_message={t("checkout.sync_error")}
          />

          {step === "address" ? (
            <AddressStep
              cartReady={cart_ready}
              initial={cart_to_address_form(cart)}
              onSaved={onAddressSaved}
            />
          ) : step === "shipping" ? (
            <ShippingStep
              cart={cart}
              currency={currency}
              onSaved={onShippingSaved}
              onBack={() => setStep("address")}
            />
          ) : step === "payment" ? (
            <PaymentStep
              cart={cart}
              currency={currency}
              onSaved={onPaymentSaved}
              onBack={() => setStep("shipping")}
            />
          ) : (
            <ReviewStep
              cart={cart}
              currency={currency}
              onBack={() => setStep("payment")}
              onPlaced={onPlaced}
            />
          )}
        </div>

        <div className="h-fit lg:sticky lg:top-6">
          <CheckoutSummary backend={cart} items={items} currency={currency} />
        </div>
      </div>
    </div>
  );
}
