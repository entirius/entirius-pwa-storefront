// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { StockAlertFormModel } from "@entirius/storefront-sdk/forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { HONEYPOT_NAME } from "@theme/ui/honeypot-field";
import { StockAlertForm as StockAlertFormView } from "@theme/forms/stock-alert-form";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { profile_query } from "@/app/[customer_country]/profile/api.query";
import { useLegalRoutes } from "@/lib/agreements";
import { is_email } from "@/lib/contact-forms";
import { is_remembered, remember_sku } from "@/lib/stock-alert-memory";
import { consent_sentence, country_segment, subscribe_stock_alert } from "@/lib/stock-alerts";
import { useAuth } from "@/providers/auth.provider";

type State = StockAlertFormModel["state"];

type Props = {
  sku: string; // the sold-out variant (or product) the request is for
  product_name: string;
  option_line?: string; // the chosen options ("Size M"); none for a product without variants
  onInStock: () => void; // the backend says it can be bought now: re-read the stock
  className?: string;
};

const ERRORS = { throttled: "stockAlert.throttled", invalid: "stockAlert.invalid", failed: "stockAlert.failed" } as const;

// "Tell me when it is back" for one sold-out SKU; the look is the theme's (@theme/forms/stock-alert-form). Mounted
// per SKU (`key`), so another size starts afresh. A SKU this browser already asked about opens in the saved state;
// only the SKU is remembered, never the address.
export function StockAlertForm({ sku, product_name, option_line, onInStock, className }: Props) {
  const { t, language } = useI18n();
  const legal = useLegalRoutes();
  const channel = make_client_access().get("ch") ?? "";
  const country = country_segment(useParams<{ customer_country?: string }>()?.customer_country);
  const api = useMemo(() => create_api(make_client_access()), []);
  const customer_email = useCustomerEmail();
  const [state, setState] = useState<State>(() => (is_remembered(channel, sku) ? "saved" : "idle"));
  // Saved during this visit (not remembered from an earlier one): announced, and focus follows the vanished form.
  const [fresh, setFresh] = useState(false);
  // The signed-in customer's address fills the field until the person types their own.
  const [typed, setTyped] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  // The template keeps its {privacy} token for TokenLinks; the sentence sent is the label as rendered.
  const consent_template = t("stockAlert.consent", { privacy: "{privacy}" });
  const privacy_label = t("checkout.privacy_link");

  const settle = (next: State) => {
    setFresh(true);
    setState(next);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    if (!is_email(email) || !consent) return settle("invalid");
    // Bots fill the hidden field: pretend it worked and send nothing.
    if (String(form.get(HONEYPOT_NAME) ?? "")) return settle("saved");
    settle("sending");
    const consent_text = consent_sentence(consent_template, privacy_label);
    const result = await subscribe_stock_alert(api, { email, sku, language, country, consent_text, website: "" });
    if (result === "saved") remember_sku(channel, sku);
    if (result === "in_stock") onInStock();
    settle(result);
  };

  return (
    <StockAlertFormView
      state={state}
      submit={submit}
      className={className}
      title_line={option_line ? t("stockAlert.for_option", { product: product_name, option: option_line }) : product_name}
      email={{ value: typed ?? customer_email, set: setTyped }}
      error={state in ERRORS ? t(ERRORS[state as keyof typeof ERRORS]) : null}
      saved={
        state === "saved"
          ? {
              text: t("stockAlert.saved", { option: option_line ?? product_name }),
              fresh,
              // Changing the request starts a fresh form, as on the first visit.
              change: () => {
                setTyped(null);
                setConsent(false);
                setState("idle");
              },
            }
          : null
      }
      consent={{
        checked: consent,
        set: setConsent,
        text: consent_template,
        links: { privacy: { route: legal.privacy, label: privacy_label } },
      }}
    />
  );
}

// The signed-in customer's address, to prefill the field; "" for a guest or until the profile answers.
function useCustomerEmail(): string {
  const { isLoggedIn } = useAuth();
  const { data: profile } = useQuery({ ...profile_query(), enabled: isLoggedIn });
  return profile?.email ?? "";
}
