// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import {
  API_CART_SHIPPING_ROUTE,
  API_CART_SHIPPING_SELECT_ROUTE,
} from "@/API/api.routes";
import {
  NORM_SHIPPING_METHODS,
  type Cart,
} from "@/utils/NORMALIZERS/cart.normalizer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageLoading, Spinner } from "@/components/ui/spinner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormError, FormHeading } from "@/components/ui/form";
import { useI18n } from "@/providers/i18n.provider";
import { TYPES_BY_METHOD } from "@/lib/delivery-points/config";
import { point_types } from "@/lib/delivery-points/point-types";
import type { CartDeliveryPoint } from "@/utils/NORMALIZERS/delivery-point.normalizer";
import { DeliveryPointPicker } from "./delivery-point-picker.client";

export function ShippingStep({
  cart,
  currency,
  onSaved,
  onBack,
}: {
  cart: Cart | null | undefined;
  currency: string;
  onSaved: (cart: unknown) => void;
  onBack: () => void;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const access = useMemo(() => make_client_access(), []);
  const api = useMemo(() => create_api(access), [access]);
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  // Preselect the method already stored on the cart (hydration), with its pickup point.
  const [selected, setSelected] = useState<string>(
    cart?.shipping_method?.code ?? "",
  );
  const [point, setPoint] = useState<CartDeliveryPoint | null>(cart?.shipping_method?.delivery_point ?? null);

  const cart_id = cart?.cart_id;
  const currency_label = cart?.currency || currency;
  const fmt = (v: string | null) => {
    if (v == null) return null;
    return parseFloat(v) === 0 ? t("common.free") : i18n.price(v, currency_label);
  };

  const {
    data: methods,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["shipping-methods", cart_id],
    enabled: !!cart_id,
    queryFn: async () => {
      const [error, response] = await api.FETCH_METHOD(API_CART_SHIPPING_ROUTE);
      if (error) throw new Error(error.message);
      return NORM_SHIPPING_METHODS(response);
    },
  });

  // A method that delivers to a pickup point asks for one before the customer goes on (null: to the address).
  const selected_method = methods?.find((m) => m.code === selected);
  const types = selected_method ? point_types(selected_method, TYPES_BY_METHOD) : null;
  const ready = !!selected && (types === null || point !== null);
  const choose_method = (code: string) => {
    setSelected(code);
    setPoint(code === cart?.shipping_method?.code ? (cart.shipping_method.delivery_point ?? null) : null);
  };
  const address = cart?.shipping_address ?? cart?.billing_address ?? null;

  const submit = () => {
    if (!ready) return;
    setSaveError(null);
    startTransition(async () => {
      const [error, response] = await api.FETCH_METHOD(
        API_CART_SHIPPING_SELECT_ROUTE,
        {
          method: "PATCH",
          body: JSON.stringify(types === null ? { code: selected } : { code: selected, delivery_point: point }),
        },
      );
      if (error) {
        setSaveError(t("checkout.shipping_failed"));
        return;
      }
      onSaved(response);
    });
  };

  let body: ReactNode;
  if (isLoading) {
    body = (
      <PageLoading className="min-h-48" />
    );
  } else if (isError || !methods || methods.length === 0) {
    // No methods for this address, or the request failed. Degrade gracefully.
    body = (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <FormHeading>{t("checkout.shipping_method")}</FormHeading>
        <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
          {t("checkout.no_shipping")}
        </p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          {t("checkout.back_to_address")}
        </Button>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-6">
        <RadioGroup
          value={selected}
          onValueChange={choose_method}
          className="gap-3"
        >
          {methods.map((m) => {
            const price = fmt(m.price);
            const active = selected === m.code;
            return (
              <label
                key={m.code}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                  active ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                )}
              >
                <RadioGroupItem value={m.code} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{m.name}</span>
                  {m.description && (
                    <span className="text-muted-foreground text-xs">
                      {m.description}
                    </span>
                  )}
                </div>
                {price && (
                  <span className="text-sm font-medium tabular-nums">
                    {price}
                  </span>
                )}
              </label>
            );
          })}
        </RadioGroup>

        {types !== null && (
          <DeliveryPointPicker
            key={selected}
            types={types}
            start={{
              street: address?.street ?? null,
              postcode: address?.postcode ?? null,
              city: address?.city ?? null,
            }}
            value={point}
            onChange={setPoint}
          />
        )}

        <FormError>{saveError}</FormError>
        {types !== null && !point && (
          <p className="text-sm text-muted-foreground">{t("checkout.point_required")}</p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} disabled={pending}>
            {t("common.back")}
          </Button>
          <Button onClick={submit} disabled={pending || !ready}>
            {pending ? <Spinner className="size-4" /> : t("checkout.to_payment")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {body}
    </div>
  );
}
