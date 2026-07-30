"use client";

import { useMemo, useState, useTransition } from "react";

import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import { API_CART_ORDERS_ROUTE } from "@/API/api.routes";
import { DEBUG_MODE } from "@/_CONFIG/app.config.json";
import type { Cart, CartAddress } from "@/utils/NORMALIZERS/cart.normalizer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DevProbeButton } from "./dev-probe-button";

export function ReviewStep({
  cart,
  currency,
  onBack,
  onPlaced,
}: {
  cart: Cart | null | undefined;
  currency: string;
  onBack: () => void;
  onPlaced: (orderId?: string) => void;
}) {
  const access = useMemo(() => make_client_access(), []);
  const api = useMemo(() => create_api(access), [access]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cart_id = cart?.cart_id;
  const currency_label = cart?.currency || currency;
  const fmt = (v: string | null | undefined) =>
    v == null ? null : parseFloat(v) === 0 ? "Free" : `${v} ${currency_label}`.trim();

  const billing = cart?.billing_address ?? null;
  const shipping = cart?.shipping_address ?? null;
  const show_shipping = !!shipping && !!billing && addresses_differ(billing, shipping);

  const place = () => {
    if (!cart_id) return;
    setError(null);
    startTransition(async () => {
      // Only 200/201 (no `err`) proceed; anything else stays on this step with an
      // annotation. A 2xx with an empty body makes the engine's res.json() throw,
      // so the try/catch keeps that from crashing the step.
      let err;
      let response;
      try {
        [err, response] = await api.FETCH_METHOD(API_CART_ORDERS_ROUTE, {
          method: "POST",
          body: JSON.stringify({ cart_id }),
        });
      } catch {
        setError("Couldn’t place your order. Please try again.");
        return;
      }
      if (err) {
        setError(
          err.message || `Couldn’t place your order (HTTP ${err.status}).`,
        );
        return;
      }
      // The gateway URL's exact key is unconfirmed until POST /orders/ works — read
      // it defensively (mostly present for online-payment methods).
      const redirect_url = pick_redirect(response);
      if (redirect_url) {
        window.location.href = redirect_url;
        return;
      }
      const r = response as { order_pretty_id?: string; order_id?: string };
      onPlaced(r?.order_pretty_id ?? r?.order_id);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {DEBUG_MODE && (
        <DevProbeButton
          label="POST order"
          method="POST"
          route={API_CART_ORDERS_ROUTE}
          body={{ cart_id }}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {billing && <AddressCard title="Billing address" a={billing} />}
        {show_shipping && shipping && (
          <AddressCard title="Shipping address" a={shipping} />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard
          title="Shipping method"
          name={cart?.shipping_method?.name}
          note={fmt(cart?.shipping_method?.price)}
        />
        <InfoCard
          title="Payment method"
          name={cart?.payment_method?.name}
          note={cart?.payment_method?.fee ? fmt(cart.payment_method.fee) : null}
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={pending}>
          Back
        </Button>
        <Button onClick={place} disabled={pending || !cart_id}>
          {pending ? <Spinner className="size-4" /> : "Place order"}
        </Button>
      </div>
    </div>
  );
}

function AddressCard({ title, a }: { title: string; a: CartAddress }) {
  const name = [a.firstname, a.lastname].filter(Boolean).join(" ");
  const phone = [a.dialling_code, a.telephone].filter(Boolean).join(" ");
  return (
    <section className="rounded-lg border p-4 text-sm">
      <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
        {title}
      </h3>
      <div className="flex flex-col gap-0.5">
        {name && <span className="font-medium">{name}</span>}
        {a.company && <span>{a.company}</span>}
        {a.street && <span>{a.street}</span>}
        <span>{[a.postcode, a.city].filter(Boolean).join(" ")}</span>
        {a.country_code && <span>{a.country_code}</span>}
        {phone && <span className="text-muted-foreground">{phone}</span>}
        {a.email && <span className="text-muted-foreground">{a.email}</span>}
        {a.tax_id && (
          <span className="text-muted-foreground">Tax ID: {a.tax_id}</span>
        )}
      </div>
    </section>
  );
}

function InfoCard({
  title,
  name,
  note,
}: {
  title: string;
  name: string | null | undefined;
  note: string | null;
}) {
  return (
    <section className="rounded-lg border p-4 text-sm">
      <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
        {title}
      </h3>
      {name ? (
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{name}</span>
          {note && <span className="tabular-nums">{note}</span>}
        </div>
      ) : (
        <span className="text-muted-foreground">Not selected</span>
      )}
    </section>
  );
}

// The backend's gateway-redirect field name isn't confirmed yet (POST /orders/
// still 500s), so accept the likely spellings and return the first non-empty URL.
function pick_redirect(response: unknown): string | null {
  const r = response as Record<string, unknown> | null | undefined;
  if (!r) return null;
  for (const k of [
    "redirect_url",
    "redirection_url",
    "redirection__url",
    "continue_url",
  ]) {
    const v = r[k];
    if (typeof v === "string" && v) return v;
  }
  return null;
}

// Whether the shipping address meaningfully differs from billing (so it's worth
// showing a second card). Mirrors the check in address.schema.ts.
function addresses_differ(b: CartAddress, s: CartAddress) {
  return (
    ["firstname", "lastname", "street", "city", "postcode", "country_code", "telephone"] as const
  ).some((k) => (s[k] ?? "") !== (b[k] ?? ""));
}
