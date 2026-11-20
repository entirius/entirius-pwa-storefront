// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { CheckoutSummaryModel } from "@entirius/storefront-sdk/checkout";
import { OrderSummaryCard } from "@theme/order/summary-card";
import { OrderTotals } from "@theme/order/order-totals";
import { SummaryLine } from "@theme/checkout/summary-line";
import { SummaryGiftLine } from "@theme/checkout/summary-gift-line";

// Checkout's summary beside the steps: the lines and gifts, the discount code, the totals.
export function CheckoutSummary({ summary }: { summary: CheckoutSummaryModel }) {
  return (
    <OrderSummaryCard>
      <div className="-mt-1 flex flex-col divide-y">
        {summary.lines.map((line) => (
          <SummaryLine key={line.sku} line={line} />
        ))}
        {summary.gift_lines.map((line) => (
          <SummaryGiftLine key={`gift-${line.sku}`} line={line} />
        ))}
      </div>
      <div className="border-t pt-4">{summary.blocks.discount_code}</div>
      <div className="border-t pt-4">
        <OrderTotals totals={summary.totals} />
      </div>
    </OrderSummaryCard>
  );
}
