// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLoading } from "@/components/ui/spinner";
import { NORM_CART, type Cart } from "@/utils/NORMALIZERS/cart.normalizer";
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

  const [step, setStep] = useState<CheckoutStep>("address");
  const [completed, setCompleted] = useState<Set<CheckoutStep>>(new Set());
  // Freshest cart from an address/shipping mutation. We deliberately don't refetch
  // ["cart"] on save (that wipes the auto-discount), so these responses — not the
  // synced query — are the freshest source for the needed fields.
  // It is dropped as soon as the synced cart refetches: that response is newer.
  const [server, setServer] = useState<{ cart: Cart; base: Cart | null | undefined } | null>(null);
  const serverCart = server && server.base === backend ? server.cart : null;
  const setServerCart = (cart: Cart) => setServer({ cart, base: backend });

  const hydrate_cart = serverCart ?? backend ?? null;

  // The stepper also shows as done what the cart already has filled in (no auto-advance).
  const done = new Set(completed);
  if (hydrate_cart?.billing_address) done.add("address");
  if (hydrate_cart?.shipping_method) done.add("shipping");
  if (hydrate_cart?.payment_method) done.add("payment");

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
    setServerCart(NORM_CART(resp));
    setCompleted((c) => new Set(c).add("address"));
    setStep("shipping");
  };

  const onShippingSaved = (resp: unknown) => {
    setServerCart(NORM_CART(resp));
    setCompleted((c) => new Set(c).add("shipping"));
    setStep("payment");
  };

  const onPaymentSaved = (resp: unknown) => {
    setServerCart(NORM_CART(resp));
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
              initial={cart_to_address_form(hydrate_cart)}
              onSaved={onAddressSaved}
            />
          ) : step === "shipping" ? (
            <ShippingStep
              cart={hydrate_cart}
              currency={currency}
              onSaved={onShippingSaved}
              onBack={() => setStep("address")}
            />
          ) : step === "payment" ? (
            <PaymentStep
              cart={hydrate_cart}
              currency={currency}
              onSaved={onPaymentSaved}
              onBack={() => setStep("shipping")}
            />
          ) : (
            <ReviewStep
              cart={hydrate_cart}
              currency={currency}
              onBack={() => setStep("payment")}
              onPlaced={onPlaced}
            />
          )}
        </div>

        <div className="h-fit lg:sticky lg:top-6">
          <CheckoutSummary backend={hydrate_cart} items={items} currency={currency} />
        </div>
      </div>
    </div>
  );
}
