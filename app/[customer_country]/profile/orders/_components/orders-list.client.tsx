"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { LinkDynamic } from "@/lib/link-dynamic";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DEBUG_MODE } from "@/_CONFIG/app.config.json";
import {
  API_CART_ORDERS_LIST_ROUTE,
  API_CART_ORDERS_V1_ROUTE,
} from "@/API/api.routes";
import { DevProbeButton } from "@/app/[customer_country]/checkout/_components/dev-probe-button";
import { orders_query } from "../api.query";
import { OrderCard } from "./order-card";

export function OrdersList() {
  const { data: orders, isLoading, isError } = useQuery(orders_query());

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <LinkDynamic href="/profile" aria-label="Back to account">
            <ChevronLeft className="size-5" />
          </LinkDynamic>
        </Button>
        <h1 className="text-2xl">My orders</h1>
      </div>

      {DEBUG_MODE && (
        <div className="flex flex-col gap-2">
          <DevProbeButton
            label="GET orders/list/ (v2)"
            route={API_CART_ORDERS_LIST_ROUTE}
          />
          <DevProbeButton
            label="GET orders/ (v1)"
            route={API_CART_ORDERS_V1_ROUTE}
          />
        </div>
      )}

      {isLoading ? (
        <Spinner className="size-5" />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your orders. Please try again later.
        </p>
      ) : !orders?.length ? (
        <p className="text-sm text-muted-foreground">
          You haven&apos;t placed any orders yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.order_uuid || order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
