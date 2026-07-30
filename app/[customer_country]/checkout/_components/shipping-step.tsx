"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import {
  API_CART_SHIPPING_ROUTE,
  API_CART_SHIPPING_SELECT_ROUTE,
} from "@/API/api.routes";
import { DEBUG_MODE } from "@/_CONFIG/app.config.json";
import {
  NORM_SHIPPING_METHODS,
  type Cart,
} from "@/utils/NORMALIZERS/cart.normalizer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DevProbeButton } from "./dev-probe-button";

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
  const access = useMemo(() => make_client_access(), []);
  const api = useMemo(() => create_api(access), [access]);
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  // Preselect the method already stored on the cart (hydration).
  const [selected, setSelected] = useState<string>(
    cart?.shipping_method?.code ?? "",
  );

  const cart_id = cart?.cart_id;
  const currency_label = cart?.currency || currency;
  const fmt = (v: string | null) => {
    if (v == null) return null;
    return parseFloat(v) === 0 ? "Free" : `${v} ${currency_label}`.trim();
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

  const submit = () => {
    if (!selected) return;
    setSaveError(null);
    startTransition(async () => {
      const [error, response] = await api.FETCH_METHOD(
        API_CART_SHIPPING_SELECT_ROUTE,
        { method: "PATCH", body: JSON.stringify({ code: selected }) },
      );
      if (error) {
        setSaveError(error.message || "Couldn’t select that shipping method.");
        return;
      }
      onSaved(response);
    });
  };

  let body: ReactNode;
  if (isLoading) {
    body = (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  } else if (isError || !methods || methods.length === 0) {
    // No methods → either the backend still errors for this address (only DE is
    // served for now) or the address genuinely has none. Degrade gracefully.
    body = (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <h2 className="text-lg font-semibold">Shipping method</h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
          No shipping methods are available for this address yet. Please check
          your address or try again later.
        </p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          Back to address
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

        {saveError && <p className="text-destructive text-sm">{saveError}</p>}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} disabled={pending}>
            Back
          </Button>
          <Button onClick={submit} disabled={pending || !selected}>
            {pending ? <Spinner className="size-4" /> : "Continue to payment"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {DEBUG_MODE && (
        <DevProbeButton
          label="GET shipping-methods"
          route={API_CART_SHIPPING_ROUTE}
        />
      )}
      {body}
    </div>
  );
}
