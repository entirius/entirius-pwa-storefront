"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { LinkDynamic } from "@/lib/link-dynamic";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  format_order_date,
  status_style,
} from "@/utils/NORMALIZERS/order.normalizer";
import { OrderDetails } from "../../_components/order-details";
import { order_query } from "../api.query";

export function OrderDetail({ order_id }: { order_id: string }) {
  const { data: order, isLoading, isError } = useQuery(order_query(order_id));
  const style = status_style(order?.status ?? "");

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <LinkDynamic href="/profile/orders" aria-label="Back to my orders">
            <ChevronLeft className="size-5" />
          </LinkDynamic>
        </Button>
        <h1 className="text-2xl">Order #{order?.id ?? order_id}</h1>
        {order && (
          <div className={cn("ml-auto rounded-full px-3 py-1", style.bg)}>
            <span className={cn("text-xs font-bold", style.text)}>
              {order.status_label || order.status}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <Spinner className="size-5" />
      ) : isError || !order ? (
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load this order. It may not exist, or it isn&apos;t
          available right now.
        </p>
      ) : (
        <>
          {order.created && (
            <p className="-mt-4 text-xs text-muted-foreground">
              Placed {format_order_date(order.created)}
            </p>
          )}
          <OrderDetails order={order} />
        </>
      )}
    </div>
  );
}
