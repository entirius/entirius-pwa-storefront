// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, useState } from "react";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { HONEYPOT_NAME } from "@theme/ui/honeypot-field";
import { EnquiryForm as EnquiryFormView } from "@theme/forms/enquiry-form";
import type { SendState } from "@entirius/storefront-sdk/forms";
import { useLegalRoutes } from "@/lib/agreements";
import { is_email, send_contact_form, useContactFormAvailable } from "@/lib/contact-forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

// The form type of the product page; the CMS block names its own (default: general).
export const PRODUCT_ENQUIRY_TYPE = "product-enquiry";

export type EnquiryContext = { sku?: string; name?: string };

type Props = {
  form_type: string; // code of the contact-forms type; no such type in the channel = nothing renders
  slug: string; // identifies the form in the CMS inbox, e.g. "product-enquiry", "contact"
  context?: EnquiryContext;
  className?: string;
  // Shown instead of the form until clicked (the product page); the form then opens in place.
  collapsed_label?: string;
  collapsed_primary?: boolean;
};

type State = SendState;

export function EnquiryForm({ form_type, slug, context, className, collapsed_label, collapsed_primary }: Props) {
  const { t, language } = useI18n();
  const legal = useLegalRoutes();
  const available = useContactFormAvailable(form_type);
  const api = useMemo(() => create_api(make_client_access()), []);
  const [open, setOpen] = useState(!collapsed_label);
  const [state, setState] = useState<State>("idle");
  const [consent, setConsent] = useState(false);

  if (!available) return null;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const email = text("email");
    if (!text("name") || !is_email(email) || !text("message") || !consent) return setState("invalid");
    // Bots fill the hidden field: pretend it worked and send nothing.
    if (text(HONEYPOT_NAME)) return setState("sent");
    setState("sending");
    const sent = await send_contact_form(api, {
      form_type,
      email,
      slug,
      language,
      code: context?.sku,
      body: { name: text("name"), message: text("message"), product_sku: context?.sku, product_name: context?.name },
    });
    setState(sent ? "sent" : "failed");
  };

  return (
    <EnquiryFormView
      state={state}
      submit={submit}
      className={className}
      id={slug}
      title={collapsed_label ?? t("enquiry.title")}
      open={open}
      open_form={() => setOpen(true)}
      trigger={collapsed_label ? { label: collapsed_label, primary: !!collapsed_primary } : null}
      consent={{
        checked: consent,
        set: setConsent,
        text: t("enquiry.consent", { privacy: "{privacy}" }),
        links: { privacy: { route: legal.privacy, label: t("checkout.privacy_link") } },
      }}
    />
  );
}
