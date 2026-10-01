// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Calendar, Eye, Package, Receipt } from "lucide-react";

import { cn } from "@/lib/utils";
import { LinkDynamic } from "@/lib/link-dynamic";
import {
  format_order_date,
  status_style,
  type Order,
} from "@/utils/NORMALIZERS/order.normalizer";

export function OrderCard({ order }: { order: Order }) {
  const style = status_style(order.status);

  const formatted_date = format_order_date(order.created);

  const items_count = order.items.length;
  const items_text = `${items_count} ${items_count === 1 ? "item" : "items"}`;

  return (
    <LinkDynamic
      href={`/profile/orders/${order.id}`}
      className="block w-full overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:border-primary"
    >
      <div className="px-5 py-3">
        {/* Top row: ID and status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <Receipt className="size-3.5 text-foreground" />
            </div>
            <span className="text-sm font-semibold">#{order.id}</span>
          </div>
          <div className={cn("rounded-full px-3 py-1", style.bg)}>
            <span className={cn("text-xs font-bold", style.text)}>
              {order.status_label || order.status}
            </span>
          </div>
        </div>

        {/* Info row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatted_date}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{items_text}</span>
            </div>
          </div>
          <span className="text-base font-bold">
            {order.total} {order.currency_code}
          </span>
        </div>

        {/* View details */}
        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-muted py-2">
          <Eye className="size-3.5 text-foreground" />
          <span className="text-sm font-bold">View details</span>
        </div>
      </div>
    </LinkDynamic>
  );
}
