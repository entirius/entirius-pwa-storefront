// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { OrderStatusModel, OrderTone } from "@entirius/storefront-sdk/account";
import { cn } from "@theme/lib/utils";

// Status-coloured text on a tint of the same colour (WCAG AA). Classes stay literal for Tailwind.
const TONES: Record<OrderTone, string> = {
  notice: "bg-notice-surface text-notice",
  positive: "bg-positive-surface text-positive",
  negative: "bg-destructive-surface text-destructive",
  informative: "bg-informative-surface text-informative",
  neutral: "bg-muted text-foreground",
};

// An order's status as a pill.
export function OrderStatus({ status, className }: { status: OrderStatusModel; className?: string }) {
  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", TONES[status.tone], className)}>{status.label}</span>;
}
