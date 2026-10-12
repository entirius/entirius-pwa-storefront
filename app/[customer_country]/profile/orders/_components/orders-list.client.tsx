"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { LinkDynamic } from "@/lib/link-dynamic";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DEBUG_MODE } from "@/_CONFIG/app.config.json";
import {
  API_CART_ORDERS_LIST_ROUTE,
  API_CART_ORDERS_V1_ROUTE,
} from "@/API/api.routes";
import type { Order } from "@/utils/NORMALIZERS/order.normalizer";
import { DevProbeButton } from "@/app/[customer_country]/checkout/_components/dev-probe-button";
import { order_query, orders_query } from "../api.query";
import { OrderCard } from "./order-card";
import { OrderDetails } from "./order-details";
import { useI18n } from "@/providers/i18n.provider";

export function OrdersList() {
  const { t } = useI18n();
  const { data: orders, isLoading, isError } = useQuery(orders_query());
  const [selected, setSelected] = useState<Order | null>(null);
  const { data: details } = useQuery({
    ...order_query(selected?.order_uuid ?? ""),
    enabled: Boolean(selected?.order_uuid),
  });

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <LinkDynamic href="/profile" aria-label={t("profile.back")}>
            <ChevronLeft className="size-5" />
          </LinkDynamic>
        </Button>
        <h1 className="text-2xl font-bold">{t("orders.title")}</h1>
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
          {t("orders.load_failed")}
        </p>
      ) : !orders?.length ? (
        <p className="text-sm text-muted-foreground">
          {t("orders.none")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.order_uuid || order.id}>
              <OrderCard
                order={order}
                is_selected={selected?.order_uuid === order.order_uuid}
                on_select={() => setSelected(order)}
              />
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>
              {selected ? t("orders.heading", { id: selected.id }) : t("orders.details")}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4">
            {selected && !details && <Spinner className="size-5" />}
            {selected && details && <OrderDetails order={details} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
