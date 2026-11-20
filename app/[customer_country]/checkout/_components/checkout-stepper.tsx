// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { OrderStep } from "@entirius/storefront-sdk/cart";
import type { MessageKey, Translate } from "@entirius/storefront-sdk/i18n";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { OrderSteps } from "@theme/order/order-steps";

export type CheckoutStep = "address" | "shipping" | "payment" | "review";

export const CHECKOUT_STEPS: { id: CheckoutStep; label: MessageKey }[] = [
  { id: "address", label: "checkout.step_address" },
  { id: "shipping", label: "checkout.step_shipping" },
  { id: "payment", label: "checkout.step_payment" },
  { id: "review", label: "checkout.step_review" },
];

// The order path for the theme's OrderSteps: the cart, then the checkout steps; done steps lead back (a link to the
// cart, `onStep` for a checkout step), the current one is plain, the next ones are not reachable yet.
// `current="cart"` is the cart page.
export function order_steps(
  t: Translate,
  current: CheckoutStep | "cart",
  completed: Set<CheckoutStep>,
  onStep?: (step: CheckoutStep) => void,
): OrderStep[] {
  return [
    current === "cart"
      ? { key: "cart", label: t("cart.title"), state: "current" }
      : { key: "cart", label: t("cart.title"), state: "done", href: "/cart" },
    ...CHECKOUT_STEPS.map((step): OrderStep => {
      const state = step.id === current ? "current" : completed.has(step.id) ? "done" : "next";
      return {
        key: step.id,
        label: t(step.label),
        state,
        go: state === "done" && onStep ? () => onStep(step.id) : undefined,
      };
    }),
  ];
}

export function CheckoutStepper({
  current,
  completed,
  onStep,
}: {
  current: CheckoutStep | "cart";
  completed: Set<CheckoutStep>;
  onStep?: (step: CheckoutStep) => void;
}) {
  const { t } = useI18n();
  return <OrderSteps steps={order_steps(t, current, completed, onStep)} />;
}
