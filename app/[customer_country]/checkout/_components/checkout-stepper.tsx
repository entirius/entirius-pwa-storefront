// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkDynamic } from "@/lib/link-dynamic";

export type CheckoutStep = "address" | "shipping" | "payment" | "review";

export const CHECKOUT_STEPS: { id: CheckoutStep; label: string }[] = [
  { id: "address", label: "Address" },
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Review" },
];

const pill = "flex h-9 items-center gap-2 rounded-full border px-3 text-sm";
const badge = "flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold";

// The order steps as pills: the cart first (a link back from checkout), then the
// checkout steps. `current="cart"` is the cart page.
export function CheckoutStepper({
  current,
  completed,
  locked,
  onStep,
}: {
  current: CheckoutStep | "cart";
  completed: Set<CheckoutStep>;
  locked: Set<CheckoutStep>;
  onStep?: (step: CheckoutStep) => void;
}) {
  const on_cart = current === "cart";
  return (
    <ol aria-label="Order steps" className="flex flex-wrap items-center gap-2">
      <li>
        {on_cart ? (
          <span aria-current="step" className={cn(pill, "border-primary bg-primary text-primary-foreground")}>
            <span className={cn(badge, "bg-primary-foreground/20")}>1</span>
            Cart
          </span>
        ) : (
          <LinkDynamic href="/cart" className={cn(pill, "border-border bg-card text-heading hover:bg-accent")}>
            <span className={cn(badge, "bg-accent text-accent-foreground")}>
              <Check className="size-3.5" aria-hidden />
            </span>
            Cart
          </LinkDynamic>
        )}
      </li>
      {CHECKOUT_STEPS.map((step, i) => {
        const is_current = step.id === current;
        const is_done = completed.has(step.id);
        const is_locked = locked.has(step.id);
        const can_go = !!onStep && (is_done || is_current) && !is_locked;
        return (
          <li key={step.id}>
            <button
              type="button"
              disabled={!can_go}
              aria-current={is_current ? "step" : undefined}
              onClick={can_go ? () => onStep!(step.id) : undefined}
              className={cn(
                pill,
                is_current && "border-primary bg-primary text-primary-foreground",
                is_done && !is_current && "border-border bg-card text-heading",
                !is_current && !is_done && "border-border bg-card text-muted-foreground",
                can_go && !is_current ? "cursor-pointer hover:bg-accent" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  badge,
                  is_current ? "bg-primary-foreground/20" : is_done ? "bg-accent text-accent-foreground" : "bg-muted",
                )}
              >
                {is_locked ? (
                  <Lock className="size-3" aria-hidden />
                ) : is_done && !is_current ? (
                  <Check className="size-3.5" aria-hidden />
                ) : (
                  i + 2
                )}
              </span>
              <span className={cn(!is_current && "hidden sm:inline")}>{step.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
