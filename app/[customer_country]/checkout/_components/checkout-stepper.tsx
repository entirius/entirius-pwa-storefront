"use client";

import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckoutStep = "address" | "shipping" | "payment" | "review";

export const CHECKOUT_STEPS: { id: CheckoutStep; label: string }[] = [
  { id: "address", label: "Address" },
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Review" },
];

export function CheckoutStepper({
  current,
  completed,
  locked,
  onStep,
}: {
  current: CheckoutStep;
  completed: Set<CheckoutStep>;
  locked: Set<CheckoutStep>;
  onStep?: (step: CheckoutStep) => void;
}) {
  return (
    <ol className="flex items-center gap-2">
      {CHECKOUT_STEPS.map((step, i) => {
        const is_current = step.id === current;
        const is_done = completed.has(step.id);
        const is_locked = locked.has(step.id);
        const can_go = !!onStep && (is_done || is_current) && !is_locked;
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!can_go}
              onClick={can_go ? () => onStep!(step.id) : undefined}
              className={cn(
                "flex items-center gap-2 text-sm",
                can_go && "cursor-pointer",
                !can_go && "cursor-default",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  is_current && "border-primary bg-primary text-primary-foreground",
                  is_done && !is_current && "border-primary text-primary",
                  !is_current && !is_done && "border-input text-muted-foreground",
                )}
              >
                {is_locked ? (
                  <Lock className="size-3.5" />
                ) : is_done && !is_current ? (
                  <Check className="size-4" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "hidden sm:inline",
                  is_current ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </button>
            {i < CHECKOUT_STEPS.length - 1 && (
              <span className="h-px flex-1 bg-border" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
