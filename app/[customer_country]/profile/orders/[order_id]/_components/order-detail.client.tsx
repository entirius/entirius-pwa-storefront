// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
import { useI18n } from "@/providers/i18n.provider";
import { OrderDetails } from "../../_components/order-details";
import { order_query } from "../api.query";

export function OrderDetail({ order_id }: { order_id: string }) {
  const { t, text, language } = useI18n();
  const { data: order, isLoading, isError } = useQuery(order_query(order_id));
  const style = status_style(order?.status ?? "");

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <LinkDynamic href="/profile/orders" aria-label={t("orders.back")}>
            <ChevronLeft className="size-5" />
          </LinkDynamic>
        </Button>
        <h1 className="text-2xl">{t("orders.heading", { id: order?.id ?? order_id })}</h1>
        {order && (
          <div className={cn("ml-auto rounded-full px-3 py-1", style.bg)}>
            <span className={cn("text-xs font-bold", style.text)}>
              {text(order.status_label)}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <Spinner className="size-5" />
      ) : isError || !order ? (
        <p className="text-sm text-muted-foreground">
          {t("orders.load_one_failed")}
        </p>
      ) : (
        <>
          {order.created && (
            <p className="-mt-4 text-xs text-muted-foreground">
              {t("orders.placed", { date: format_order_date(order.created, language) })}
            </p>
          )}
          <OrderDetails order={order} />
        </>
      )}
    </div>
  );
}
