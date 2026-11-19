// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { ChevronRight } from "lucide-react";
import type { OrderStep } from "@entirius/storefront-sdk/cart";
import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";

// The order steps as breadcrumbs: done steps are links back (the cart, completed checkout steps), the current one
// is plain bold text, the next ones muted text. Phones get "Step 2 of 5 · Address" and a segment bar instead.
// The core decides the steps and their order; this only shows them.
export function OrderSteps({ steps }: { steps: OrderStep[] }) {
  const { t } = useI18n();
  const position = steps.findIndex((step) => step.state === "current");

  return (
    <nav aria-label={t("checkout.steps")}>
      <ol className="hidden flex-wrap items-center gap-x-2 gap-y-1 text-sm sm:flex">
        {steps.map((step, i) => (
          <li key={step.key} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />}
            <StepLabel step={step} />
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-2 sm:hidden">
        <p className="text-sm">
          {t("checkout.step_of", { current: position + 1, total: steps.length, label: steps[position]?.label ?? "" })}
        </p>
        <div aria-hidden className="grid grid-flow-col gap-1">
          {steps.map((step, i) => (
            <span key={step.key} className={cn("h-0.5 rounded-full", i <= position ? "bg-foreground" : "bg-border")} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function StepLabel({ step }: { step: OrderStep }) {
  if (step.state === "current") {
    return (
      <span aria-current="step" className="font-semibold text-heading">
        {step.label}
      </span>
    );
  }
  if (step.href) {
    return (
      <Link href={step.href} className="link relative touch-target">
        {step.label}
      </Link>
    );
  }
  if (step.go) {
    return (
      <button type="button" onClick={step.go} className="link relative touch-target cursor-pointer">
        {step.label}
      </button>
    );
  }
  return <span className="text-muted-foreground">{step.label}</span>;
}
