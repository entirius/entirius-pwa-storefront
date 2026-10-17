// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkDynamic } from "@/lib/link-dynamic";
import type { MessageKey } from "@/lib/i18n/translate";
import { useI18n } from "@/providers/i18n.provider";

export type CheckoutStep = "address" | "shipping" | "payment" | "review";

export const CHECKOUT_STEPS: { id: CheckoutStep; label: MessageKey }[] = [
  { id: "address", label: "checkout.step_address" },
  { id: "shipping", label: "checkout.step_shipping" },
  { id: "payment", label: "checkout.step_payment" },
  { id: "review", label: "checkout.step_review" },
];

type Crumb = { key: string; label: string; state: "done" | "current" | "next"; go?: () => void; href?: string };

// The order steps as breadcrumbs: done steps are links back (the cart, completed checkout steps), the current one
// is plain bold text, the next ones muted text. Phones get "Step 2 of 5 · Address" and a segment bar instead.
// `current="cart"` is the cart page.
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
  const crumbs: Crumb[] = [
    current === "cart"
      ? { key: "cart", label: t("cart.title"), state: "current" }
      : { key: "cart", label: t("cart.title"), state: "done", href: "/cart" },
    ...CHECKOUT_STEPS.map((step): Crumb => {
      const state = step.id === current ? "current" : completed.has(step.id) ? "done" : "next";
      return {
        key: step.id,
        label: t(step.label),
        state,
        go: state === "done" && onStep ? () => onStep(step.id) : undefined,
      };
    }),
  ];
  const position = crumbs.findIndex((c) => c.state === "current");

  return (
    <nav aria-label={t("checkout.steps")}>
      <ol className="hidden flex-wrap items-center gap-x-2 gap-y-1 text-sm sm:flex">
        {crumbs.map((crumb, i) => (
          <li key={crumb.key} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />}
            <CrumbLabel crumb={crumb} />
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-2 sm:hidden">
        <p className="text-sm">
          {t("checkout.step_of", { current: position + 1, total: crumbs.length, label: crumbs[position]?.label ?? "" })}
        </p>
        <div aria-hidden className="grid grid-flow-col gap-1">
          {crumbs.map((crumb, i) => (
            <span key={crumb.key} className={cn("h-0.5 rounded-full", i <= position ? "bg-foreground" : "bg-border")} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function CrumbLabel({ crumb }: { crumb: Crumb }) {
  if (crumb.state === "current") {
    return (
      <span aria-current="step" className="font-semibold text-heading">
        {crumb.label}
      </span>
    );
  }
  if (crumb.href) {
    return (
      <LinkDynamic href={crumb.href} className="link relative touch-target">
        {crumb.label}
      </LinkDynamic>
    );
  }
  if (crumb.go) {
    return (
      <button type="button" onClick={crumb.go} className="link relative touch-target cursor-pointer">
        {crumb.label}
      </button>
    );
  }
  return <span className="text-muted-foreground">{crumb.label}</span>;
}
