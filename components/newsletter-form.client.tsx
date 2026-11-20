// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, useState } from "react";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { HONEYPOT_NAME } from "@theme/ui/honeypot-field";
import { NewsletterForm as NewsletterFormView } from "@theme/forms/newsletter-form";
import { useLegalRoutes } from "@/lib/agreements";
import { is_email } from "@/lib/contact-forms";
import { subscribe_newsletter, useNewsletterAvailable } from "@/lib/newsletter";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

import type { SendState } from "@entirius/storefront-sdk/forms";

type State = SendState;

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

  return (
    <NewsletterFormView
      state={state}
      submit={submit}
      className={className}
      consent={{
        checked: consent,
        set: setConsent,
        text: t("newsletter.consent", { privacy: "{privacy}" }),
        links: { privacy: { route: legal.privacy, label: t("checkout.privacy_link") } },
      }}
    />
  );
}
