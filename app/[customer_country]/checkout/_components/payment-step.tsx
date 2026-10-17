// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import {
  API_CART_PAYMENT_ROUTE,
  API_CART_PAYMENT_SELECT_ROUTE,
} from "@/API/api.routes";
import {
  NORM_PAYMENT_METHODS,
  type Cart,
} from "@/utils/NORMALIZERS/cart.normalizer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageLoading, Spinner } from "@/components/ui/spinner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormError, FormHeading } from "@/components/ui/form";
import { useI18n } from "@/providers/i18n.provider";
// Payment methods offered for the cart; the review step reads the same entry for the method text.
export function usePaymentMethods(cart_id: string | undefined) {
  const api = useMemo(() => create_api(make_client_access()), []);
  return useQuery({
    queryKey: ["payment-methods", cart_id],
    enabled: !!cart_id,
    queryFn: async () => {
      const [error, response] = await api.FETCH_METHOD(API_CART_PAYMENT_ROUTE);
      if (error) throw new Error(error.message);
      return NORM_PAYMENT_METHODS(response);
    },
  });
}

export function PaymentStep({
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

  // Preselect the method already stored on the cart (hydration).
  const [selected, setSelected] = useState<string>(
    cart?.payment_method?.code ?? "",
  );

  const cart_id = cart?.cart_id;
  const currency_label = cart?.currency || currency;
  const fmt = (v: string | null) => {
    if (v == null) return null;
    return parseFloat(v) === 0 ? null : i18n.price(v, currency_label);
  };

  const { data: methods, isLoading, isError } = usePaymentMethods(cart_id);

  const submit = () => {
    if (!selected) return;
    setSaveError(null);
    startTransition(async () => {
      const [error, response] = await api.FETCH_METHOD(
        API_CART_PAYMENT_SELECT_ROUTE,
        { method: "PATCH", body: JSON.stringify({ code: selected }) },
      );
      if (error) {
        setSaveError(t("checkout.payment_failed"));
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
    // No methods, or the request failed. Degrade gracefully.
    body = (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <FormHeading>{t("checkout.step_payment")}</FormHeading>
        <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
          {t("checkout.no_payment")}
        </p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          {t("checkout.back_to_shipping")}
        </Button>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-6">
        <RadioGroup
          value={selected}
          onValueChange={setSelected}
          className="gap-3"
        >
          {methods.map((m) => {
            const fee = fmt(m.fee);
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
                {m.image && (
                  // Logo host is backend-provided / unconfigured for next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.image}
                    alt=""
                    className="size-8 shrink-0 object-contain"
                  />
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{m.name}</span>
                  {m.description && (
                    <span className="text-muted-foreground text-xs">
                      {m.description}
                    </span>
                  )}
                </div>
                {fee && (
                  <span className="text-sm font-medium tabular-nums">
                    +{fee}
                  </span>
                )}
              </label>
            );
          })}
        </RadioGroup>

        <FormError>{saveError}</FormError>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} disabled={pending}>
            {t("common.back")}
          </Button>
          <Button onClick={submit} disabled={pending || !selected}>
            {pending ? <Spinner className="size-4" /> : t("checkout.to_review")}
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
