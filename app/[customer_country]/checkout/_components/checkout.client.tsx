// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LinkDynamic } from "@/lib/link-dynamic";
import { NORM_CART, type Cart } from "@/utils/NORMALIZERS/cart.normalizer";
import type { PlacedOrder } from "@/utils/NORMALIZERS/order.normalizer";
import { cart_to_address_form } from "@/utils/validation/address.schema";
import { useCartSync } from "@/stores/use-cart-sync";
import { useI18n } from "@/providers/i18n.provider";
import { cart_error_texts } from "@/utils/cart-errors";
import { CheckoutStepper, type CheckoutStep } from "./checkout-stepper";
import { CheckoutSummary } from "./checkout-summary";
import { AddressStep } from "./address-step";
import { ShippingStep } from "./shipping-step";
import { PaymentStep } from "./payment-step";
import { ReviewStep } from "./review-step";
import { order_refs } from "./order-receipt";

const LOCKED: Set<CheckoutStep> = new Set();

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

  // Reflect fields the cart already has filled in the stepper (no auto-advance).
  useEffect(() => {
    if (!hydrate_cart) return;
    setCompleted((c) => {
      const next = new Set(c);
      if (hydrate_cart.billing_address) next.add("address");
      if (hydrate_cart.shipping_method) next.add("shipping");
      if (hydrate_cart.payment_method) next.add("payment");
      return next.size === c.size ? c : next;
    });
  }, [hydrate_cart]);

  if (!mounted) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-6 text-2xl">{t("checkout.title")}</h1>
        <p className="text-muted-foreground py-8 text-center">
          {t("checkout.empty")}
        </p>
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <LinkDynamic href="/">{t("common.continue_shopping")}</LinkDynamic>
          </Button>
        </div>
      </div>
    );
  }

  const cart_ready = !!backend?.cart_id;
  const validation_ok = backend?.validation_status === "valid";

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
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-4xl md:text-5xl">{t("checkout.title")}</h1>
        {isFetching && <Spinner className="size-4" />}
      </div>

      <CheckoutStepper
        current={step}
        completed={completed}
        locked={LOCKED}
        onStep={setStep}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          {error && (
            <p className="mb-4 rounded-md border border-destructive/50 bg-destructive-surface px-3 py-2 text-sm text-destructive">
              {t("checkout.sync_error")}
            </p>
          )}
          {backend && !validation_ok && backend.errors.length > 0 && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive-surface px-3 py-2 text-sm text-destructive">
              <p className="font-medium">{t("checkout.items_attention")}</p>
              <ul className="mt-1 list-disc pl-5">
                {cart_error_texts(backend.errors, t).map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </div>
          )}

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
