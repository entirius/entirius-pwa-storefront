// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { profile_query } from "@/app/[customer_country]/profile/api.query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { HONEYPOT_NAME, HoneypotField } from "@/components/ui/honeypot-field";
import { Input } from "@/components/ui/input";
import { CheckLabel, Field, FormError, FormHeading } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { TokenLinks } from "@/components/ui/token-links";
import { useLegalRoutes } from "@/lib/agreements";
import { is_email } from "@/lib/contact-forms";
import { is_remembered, remember_sku } from "@/lib/stock-alert-memory";
import { consent_sentence, country_segment, subscribe_stock_alert, type SubscribeResult } from "@/lib/stock-alerts";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth.provider";
import { useI18n } from "@/providers/i18n.provider";

type State = "idle" | "sending" | SubscribeResult;

type Props = {
  sku: string; // the sold-out variant (or product) the request is for
  product_name: string;
  option_line?: string; // the chosen options ("Size M"); none for a product without variants
  onInStock: () => void; // the backend says it can be bought now: re-read the stock
  className?: string;
};

const ERRORS = { throttled: "stockAlert.throttled", invalid: "stockAlert.invalid", failed: "stockAlert.failed" } as const;

// "Tell me when it is back" for one sold-out SKU. Mounted per SKU (`key`), so another size starts afresh. A SKU this
// browser already asked about opens in the saved state; only the SKU is remembered, never the address.
export function StockAlertForm({ sku, product_name, option_line, onInStock, className }: Props) {
  const { t } = useI18n();
  const channel = make_client_access().get("ch") ?? "";
  const [state, setState] = useState<State>(() => (is_remembered(channel, sku) ? "saved" : "idle"));
  // Saved during this visit (not remembered from an earlier one): announced, and focus follows the vanished form.
  const [fresh, setFresh] = useState(false);
  const what = option_line ?? product_name;

  if (state === "saved") {
    return (
      <div data-stock-alert data-stock-alert-state="saved" className={cn("flex flex-col items-start gap-2", className)}>
        <SavedNote fresh={fresh}>{t("stockAlert.saved", { option: what })}</SavedNote>
        <Button type="button" variant="link" className="h-auto p-0 text-sm" onClick={() => setState("idle")}>
          {t("stockAlert.saved_change")}
        </Button>
      </div>
    );
  }
  return (
    <AlertForm
      channel={channel}
      sku={sku}
      title_line={option_line ? t("stockAlert.for_option", { product: product_name, option: option_line }) : product_name}
      state={state}
      setState={(next) => {
        setFresh(true);
        setState(next);
      }}
      onInStock={onInStock}
      className={className}
    />
  );
}

// A fresh save is announced and takes the focus once (the submit button that had it is gone); a request remembered
// from an earlier visit is plain text, not read out on every page load.
function SavedNote({ fresh, children }: { fresh: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (fresh) ref.current?.focus();
  }, [fresh]);
  return (
    <p ref={ref} role={fresh ? "status" : undefined} tabIndex={-1} className="text-sm outline-none">
      {children}
    </p>
  );
}

type FormProps = {
  channel: string;
  sku: string;
  title_line: string;
  state: State;
  setState: (state: State) => void;
  onInStock: () => void;
  className?: string;
};

function AlertForm({ channel, sku, title_line, state, setState, onInStock, className }: FormProps) {
  const { t, language } = useI18n();
  const legal = useLegalRoutes();
  const id = useId();
  const country = country_segment(useParams<{ customer_country?: string }>()?.customer_country);
  const api = useMemo(() => create_api(make_client_access()), []);
  const customer_email = useCustomerEmail();
  // The signed-in customer's address fills the field until the person types their own.
  const [typed, setTyped] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  // The template keeps its {privacy} token for TokenLinks; the sentence sent is the label as rendered.
  const consent_template = t("stockAlert.consent", { privacy: "{privacy}" });
  const privacy_label = t("checkout.privacy_link");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    if (!is_email(email) || !consent) return setState("invalid");
    // Bots fill the hidden field: pretend it worked and send nothing.
    if (String(form.get(HONEYPOT_NAME) ?? "")) return setState("saved");
    setState("sending");
    const consent_text = consent_sentence(consent_template, privacy_label);
    const result = await subscribe_stock_alert(api, { email, sku, language, country, consent_text, website: "" });
    if (result === "saved") remember_sku(channel, sku);
    if (result === "in_stock") onInStock();
    setState(result);
  };

  const error = state in ERRORS ? t(ERRORS[state as keyof typeof ERRORS]) : null;
  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby={`${id}-title`}
      data-stock-alert
      data-stock-alert-state={state}
      className={cn("surface-outline relative flex flex-col gap-3 text-left", className)}
    >
      <FormHeading id={`${id}-title`} description={title_line}>
        {t("stockAlert.title")}
      </FormHeading>
      <Field id={`${id}-email`} label={t("stockAlert.email")}>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          value={typed ?? customer_email}
          onChange={(e) => setTyped(e.target.value)}
          required
        />
      </Field>
      <HoneypotField />
      <CheckLabel data-stock-alert-consent>
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} aria-required />
        <span>
          <TokenLinks text={consent_template} links={{ privacy: { route: legal.privacy, label: privacy_label } }} />
        </span>
      </CheckLabel>
      {state === "in_stock" && <p role="status" className="text-sm">{t("stockAlert.in_stock")}</p>}
      <FormError>{error}</FormError>
      <Button type="submit" className="w-full" disabled={state === "sending"}>
        {state === "sending" ? <Spinner className="size-4" /> : t("stockAlert.submit")}
      </Button>
    </form>
  );
}

// The signed-in customer's address, to prefill the field; "" for a guest or until the profile answers.
function useCustomerEmail(): string {
  const { isLoggedIn } = useAuth();
  const { data: profile } = useQuery({ ...profile_query(), enabled: isLoggedIn });
  return profile?.email ?? "";
}
