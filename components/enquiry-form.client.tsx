// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, useState } from "react";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { HONEYPOT_NAME, HoneypotField } from "@/components/ui/honeypot-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { TokenLinks } from "@/components/ui/token-links";
import { PRIVACY_ROUTE } from "@/lib/checkout-config";
import { is_email, send_contact_form, useContactFormAvailable } from "@/lib/contact-forms";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n.provider";

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

type State = "idle" | "sending" | "sent" | "failed" | "invalid";

export function EnquiryForm({ form_type, slug, context, className, collapsed_label, collapsed_primary }: Props) {
  const { t, language } = useI18n();
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

  if (!open) {
    return (
      <Button
        type="button"
        size="lg"
        variant={collapsed_primary ? "default" : "outline"}
        className={cn("w-full rounded-full", className)}
        data-enquiry-trigger
        onClick={() => setOpen(true)}
      >
        {collapsed_label}
      </Button>
    );
  }

  if (state === "sent") {
    return (
      <p role="status" data-enquiry-sent className={cn("rounded-2xl border p-4 text-sm", className)}>
        {t("enquiry.sent")}
      </p>
    );
  }

  const field = "flex flex-col gap-1.5";
  return (
    <form
      onSubmit={submit}
      noValidate
      data-enquiry-form
      className={cn("relative flex flex-col gap-3 rounded-2xl border p-4", className)}
    >
      <h2 className="text-base font-semibold">{collapsed_label ?? t("enquiry.title")}</h2>
      <div className={field}>
        <Label htmlFor={`enq-name-${slug}`}>{t("enquiry.name")}</Label>
        <Input id={`enq-name-${slug}`} name="name" autoComplete="name" required />
      </div>
      <div className={field}>
        <Label htmlFor={`enq-email-${slug}`}>{t("enquiry.email")}</Label>
        <Input id={`enq-email-${slug}`} name="email" type="email" autoComplete="email" required />
      </div>
      <div className={field}>
        <Label htmlFor={`enq-message-${slug}`}>{t("enquiry.message")}</Label>
        <Textarea id={`enq-message-${slug}`} name="message" rows={4} required />
      </div>
      <HoneypotField />
      <label className="flex items-start gap-3 text-sm" data-enquiry-consent>
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" aria-required />
        <span>
          <TokenLinks
            text={t("enquiry.consent", { privacy: "{privacy}" })}
            links={{ privacy: { route: PRIVACY_ROUTE, label: t("checkout.privacy_link") } }}
          />
        </span>
      </label>
      {state === "invalid" && <p role="alert" className="text-sm text-destructive">{t("enquiry.invalid")}</p>}
      {state === "failed" && <p role="alert" className="text-sm text-destructive">{t("enquiry.failed")}</p>}
      <Button type="submit" disabled={state === "sending"}>
        {state === "sending" ? <Spinner className="size-4" /> : t("enquiry.send")}
      </Button>
    </form>
  );
}
