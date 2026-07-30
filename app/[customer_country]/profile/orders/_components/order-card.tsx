"use client";

import { Calendar, Eye, Package, Receipt } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  format_order_date,
  status_style,
  type Order,
} from "@/utils/NORMALIZERS/order.normalizer";

type OrderCardProps = {
  order: Order;
  is_selected: boolean;
  on_select: () => void;
};

export function OrderCard({ order, is_selected, on_select }: OrderCardProps) {
  const style = status_style(order.status);

  const formatted_date = format_order_date(order.created);

  const items_count = order.items.length;
  const items_text = `${items_count} ${items_count === 1 ? "item" : "items"}`;

  return (
    <button
      type="button"
      onClick={on_select}
      className={cn(
        "w-full overflow-hidden rounded-xl border border-border bg-card text-left transition-colors",
        is_selected && "border-primary bg-primary/5",
      )}
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
        <div
          className={cn(
            "mt-3 flex items-center justify-center gap-2 rounded-lg py-2",
            is_selected ? "bg-primary" : "bg-muted",
          )}
        >
          <Eye
            className={cn(
              "size-3.5",
              is_selected ? "text-primary-foreground" : "text-foreground",
            )}
          />
          <span
            className={cn(
              "text-sm font-bold",
              is_selected && "text-primary-foreground",
            )}
          >
            {is_selected ? "Viewing details" : "View details"}
          </span>
        </div>
      </div>
    </button>
  );
}
