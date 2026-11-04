// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, useState, useTransition } from "react";

import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import { API_CART_ORDERS_ROUTE } from "@/API/api.routes";
import type { Cart, CartAddress } from "@/utils/NORMALIZERS/cart.normalizer";
import {
  NORM_PLACED_ORDER,
  type PlacedOrder,
} from "@/utils/NORMALIZERS/order.normalizer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { SanitizeHTML } from "@/components/ui/sanitize-html";
import { TokenLinks } from "@/components/ui/token-links";
import { record_order_agreements, useAgreementDefinitions, useLegalRoutes } from "@/lib/agreements";
import { subscribe_newsletter, useNewsletterAvailable } from "@/lib/newsletter";
import {
  checkout_agreements,
  consent_source,
  type AgreementDefinition,
} from "@/utils/NORMALIZERS/agreement.normalizer";
import { order_refs, save_receipt, type OrderReceipt } from "./order-receipt";
import { usePaymentMethods } from "./payment-step";
import { CheckLabel, FormError } from "@/components/ui/form";
import { useI18n } from "@/providers/i18n.provider";

export function ReviewStep({
  cart,
  currency,
  onBack,
  onPlaced,
}: {
  cart: Cart | null | undefined;
  currency: string;
  onBack: () => void;
  onPlaced: (order: PlacedOrder) => void;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const access = useMemo(() => make_client_access(), []);
  const api = useMemo(() => create_api(access), [access]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // The agreements come from the backend (its wording is what it keeps with the order). Without an answer or
  // without mandatory definitions the shop's own consent line stands in, and nothing is recorded.
  const { data: definitions, isPending: definitions_pending } = useAgreementDefinitions(i18n.language);
  const newsletter_available = useNewsletterAvailable();
  const legal = useLegalRoutes();
  const { mandatory, marketing_email } = checkout_agreements(definitions ?? []);
  const source = consent_source(definitions, definitions_pending);
  const from_backend = source === "backend";
  const offered_marketing = from_backend && newsletter_available ? marketing_email : null;
  const [checked, setChecked] = useState<ReadonlySet<string>>(() => new Set());
  const [line_accepted, setLineAccepted] = useState(false);
  const accepted = from_backend ? mandatory.every((d) => checked.has(d.slug)) : source === "shop" && line_accepted;
  const toggle = (slug: string, on: boolean) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (on) next.add(slug);
      else next.delete(slug);
      return next;
    });

  const cart_id = cart?.cart_id;
  // The cart's own payment method has no description; the offered list has (bank details etc.).
  const { data: offered } = usePaymentMethods(cart_id);
  const offered_payment = offered?.find((m) => m.code === cart?.payment_method?.code);
  // What happens after an offline transfer order: the shop's own wording (empty message = nothing).
  const transfer_note = offered_payment?.is_transfer ? t("checkout.transfer_next").trim() : "";
  const currency_label = cart?.currency || currency;
  const fmt = (v: string | null | undefined) =>
    v == null ? null : parseFloat(v) === 0 ? t("common.free") : i18n.price(v, currency_label);

  const billing = cart?.billing_address ?? null;
  const shipping = cart?.shipping_address ?? null;
  const show_shipping = !!shipping && !!billing && addresses_differ(billing, shipping);

  // Once the order exists: the accepted agreements are recorded with it (the backend takes them for an existing
  // order only), and the newsletter opt-in starts its double opt-in. Neither holds the order up.
  const after_order = async (order_id: string) => {
    const email = billing?.email ?? "";
    if (from_backend) {
      await record_order_agreements(api, {
        order_id,
        email,
        slugs: mandatory.map((d) => d.slug),
        language: i18n.language,
      });
    }
    if (offered_marketing && checked.has(offered_marketing.slug) && email) {
      await subscribe_newsletter(api, email, i18n.language).catch(() => false);
    }
  };

  const place = () => {
    if (!cart_id || !accepted) return;
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
        setError(t("checkout.order_failed"));
        return;
      }
      if (err) {
        setError(t("checkout.order_failed_http", { status: String(err.status) }));
        return;
      }
      // An online-payment method hands back its gateway; bank transfer and cash
      // on delivery do not. The order exists either way, payment_error included.
      const order = NORM_PLACED_ORDER(response);
      await after_order(order.order_id);
      if (order.redirect_url && !order.payment_error) {
        window.location.href = order.redirect_url;
        return;
      }
      const refs = order_refs(order);
      if (refs.length) save_receipt(build_receipt(refs));
      onPlaced(order);
    });
  };

  const build_receipt = (refs: string[]): OrderReceipt => {
    const payment = cart?.payment_method;
    return {
      refs,
      placed_at: new Date().toISOString(),
      total: cart?.total_gross ?? null,
      currency: currency_label,
      payment: payment
        ? {
            name: payment.name,
            description: offered_payment?.description ?? null,
            is_transfer: !!offered_payment?.is_transfer,
          }
        : null,
      shipping: cart?.shipping_method
        ? { name: cart.shipping_method.name, price: cart.shipping_gross }
        : null,
    };
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {billing && <AddressCard title={t("checkout.billing_address")} a={billing} />}
        {show_shipping && shipping && (
          <AddressCard title={t("checkout.shipping_address")} a={shipping} />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard
          title={t("checkout.shipping_method")}
          name={cart?.shipping_method?.name}
          note={fmt(cart?.shipping_gross)}
        />
        <InfoCard
          title={t("checkout.payment_method")}
          name={cart?.payment_method?.name}
          note={cart?.payment_method?.fee ? fmt(cart.payment_method.fee) : null}
        />
      </div>

      {transfer_note && (
        <p data-transfer-next className="rounded-lg border bg-muted p-4 text-sm">
          {transfer_note}
        </p>
      )}

      {source === "pending" ? (
        <div aria-hidden className="h-10 animate-pulse rounded-md bg-muted" />
      ) : from_backend ? (
        <div className="flex flex-col gap-3">
          {mandatory.map((d) => (
            <AgreementCheck
              key={d.slug}
              definition={d}
              required
              checked={checked.has(d.slug)}
              onChange={(on) => toggle(d.slug, on)}
            />
          ))}
          {offered_marketing && (
            <AgreementCheck
              definition={offered_marketing}
              checked={checked.has(offered_marketing.slug)}
              onChange={(on) => toggle(offered_marketing.slug, on)}
            />
          )}
        </div>
      ) : (
        <CheckLabel data-terms-consent>
          <Checkbox
            checked={line_accepted}
            onCheckedChange={(v) => setLineAccepted(v === true)}
            aria-required
          />
          <span>
            <TokenLinks
              text={t("checkout.terms_consent", { terms: "{terms}", privacy: "{privacy}" })}
              links={{
                terms: { route: legal.terms, label: t("checkout.terms_link") },
                privacy: { route: legal.privacy, label: t("checkout.privacy_link") },
              }}
            />
          </span>
        </CheckLabel>
      )}

      <FormError>{error}</FormError>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={pending}>
          {t("common.back")}
        </Button>
        <Button
          className="h-auto min-h-9 min-w-0 flex-1 whitespace-normal py-2 sm:flex-none"
          onClick={place}
          disabled={pending || !cart_id || !accepted}
          title={accepted ? undefined : t("checkout.terms_required")}
        >
          {pending ? <Spinner className="size-4" /> : t("checkout.place_order")}
        </Button>
      </div>
    </div>
  );
}

// One agreement as a checkbox with the backend's summary. Its links (the terms, the privacy policy) open in a new
// tab, so the checkout stays where it is.
function AgreementCheck({
  definition,
  required = false,
  checked,
  onChange,
}: {
  definition: AgreementDefinition;
  required?: boolean;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <CheckLabel data-agreement={definition.slug} data-agreement-required={required ? "" : undefined}>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} aria-required={required || undefined} />
      <SanitizeHTML as="span" html={definition.summary} new_tab_links="all" className="[&_a]:underline" />
    </CheckLabel>
  );
}

function AddressCard({ title, a }: { title: string; a: CartAddress }) {
  const { t } = useI18n();
  const name = [a.firstname, a.lastname].filter(Boolean).join(" ");
  const phone = [a.dialling_code, a.telephone].filter(Boolean).join(" ");
  return (
    <section className="surface-outline text-sm">
      <h3 className="text-muted-foreground mb-2 text-xs uppercase">
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
          <span className="text-muted-foreground">{t("address.tax_id_line", { value: a.tax_id })}</span>
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
  const { t } = useI18n();
  return (
    <section className="surface-outline text-sm">
      <h3 className="text-muted-foreground mb-2 text-xs uppercase">
        {title}
      </h3>
      {name ? (
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{name}</span>
          {note && <span className="tabular-nums">{note}</span>}
        </div>
      ) : (
        <span className="text-muted-foreground">{t("checkout.not_selected")}</span>
      )}
    </section>
  );
}

// Whether the shipping address meaningfully differs from billing (so it's worth
// showing a second card). Mirrors the check in address.schema.ts.
function addresses_differ(b: CartAddress, s: CartAddress) {
  return (
    ["firstname", "lastname", "street", "city", "postcode", "country_code", "telephone"] as const
  ).some((k) => (s[k] ?? "") !== (b[k] ?? ""));
}
