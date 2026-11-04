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
import { CheckLabel, Field, FormError, FormHeading } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { TokenLinks } from "@/components/ui/token-links";
import { useLegalRoutes } from "@/lib/agreements";
import { is_email } from "@/lib/contact-forms";
import { subscribe_newsletter, useNewsletterAvailable } from "@/lib/newsletter";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n.provider";

type State = "idle" | "sending" | "sent" | "failed" | "invalid";

// Newsletter sign-up (footer): the email and the consent; the backend then mails a confirmation link (double
// opt-in). Renders nothing when the channel has no newsletter key.
export function NewsletterForm({ className }: { className?: string }) {
  const { t, language } = useI18n();
  const legal = useLegalRoutes();
  const available = useNewsletterAvailable();
  const api = useMemo(() => create_api(make_client_access()), []);
  const [state, setState] = useState<State>("idle");
  const [consent, setConsent] = useState(false);

  if (!available) return null;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    if (!is_email(email) || !consent) return setState("invalid");
    // Bots fill the hidden field: pretend it worked and send nothing.
    if (String(form.get(HONEYPOT_NAME) ?? "")) return setState("sent");
    setState("sending");
    setState((await subscribe_newsletter(api, email, language)) ? "sent" : "failed");
  };

  if (state === "sent") {
    return (
      <p role="status" data-newsletter-sent className={cn("max-w-xs text-sm", className)}>
        {t("newsletter.sent")}
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate data-newsletter-form className={cn("relative flex max-w-xs flex-col gap-3", className)}>
      <FormHeading className="text-base text-heading" description={t("newsletter.intro")}>
        {t("newsletter.title")}
      </FormHeading>
      <Field id="newsletter-email" label={t("newsletter.email")}>
        <Input id="newsletter-email" name="email" type="email" autoComplete="email" required />
      </Field>
      <HoneypotField />
      <CheckLabel data-newsletter-consent>
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} aria-required />
        <span>
          <TokenLinks
            text={t("newsletter.consent", { privacy: "{privacy}" })}
            links={{ privacy: { route: legal.privacy, label: t("checkout.privacy_link") } }}
          />
        </span>
      </CheckLabel>
      {state === "invalid" && <FormError>{t("newsletter.invalid")}</FormError>}
      {state === "failed" && <FormError>{t("newsletter.failed")}</FormError>}
      <Button type="submit" variant="outline" disabled={state === "sending"}>
        {state === "sending" ? <Spinner className="size-4" /> : t("newsletter.subscribe")}
      </Button>
    </form>
  );
}
