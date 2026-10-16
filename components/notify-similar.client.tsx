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
import { Textarea } from "@/components/ui/textarea";
import { TokenLinks } from "@/components/ui/token-links";
import { PRIVACY_ROUTE } from "@/lib/checkout-config";
import { is_email, send_contact_form, useContactFormAvailable } from "@/lib/contact-forms";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n.provider";
import type { MessageKey } from "@/lib/i18n/translate";

// Form type of the contact-forms module that carries "tell me when a similar product arrives" requests.
export const NOTIFY_SIMILAR_TYPE = "notify-similar";

type Props = {
  // What the seller reads in the request: sku, product_name, category...
  body: Record<string, string | undefined>;
  code?: string; // the SKU of the sold-out product
  trigger_label: string;
  title_key?: MessageKey;
  className?: string;
  // Optional control from outside (the sticky buy bar opens the form); the button manages itself otherwise.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type State = "idle" | "sending" | "sent" | "failed" | "invalid";

// Whether the channel offers the request (a contact-forms key AND the `notify-similar` type).
export const useNotifySimilarAvailable = () => useContactFormAvailable(NOTIFY_SIMILAR_TYPE);

// A button that opens the request form in place. Renders nothing unless the request is available.
export function NotifySimilar({
  body,
  code,
  trigger_label,
  title_key = "notify.title",
  className,
  open: controlled_open,
  onOpenChange,
}: Props) {
  const { t, language } = useI18n();
  const available = useNotifySimilarAvailable();
  const api = useMemo(() => create_api(make_client_access()), []);
  const [own_open, setOwnOpen] = useState(false);
  const open = controlled_open ?? own_open;
  const setOpen = onOpenChange ?? setOwnOpen;
  const [state, setState] = useState<State>("idle");
  const [consent, setConsent] = useState(false);

  if (!available) return null;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const email = text("email");
    if (!is_email(email) || !consent) return setState("invalid");
    // Bots fill the hidden field: pretend it worked and send nothing.
    if (text(HONEYPOT_NAME)) return setState("sent");
    setState("sending");
    const sent = await send_contact_form(api, {
      form_type: NOTIFY_SIMILAR_TYPE,
      email,
      slug: NOTIFY_SIMILAR_TYPE,
      language,
      code,
      body: { ...body, note: text("note"), language },
    });
    setState(sent ? "sent" : "failed");
  };

  if (!open) {
    return (
      <Button
        type="button"
        size="lg"
        className={cn("w-full", className)}
        data-notify-trigger
        onClick={() => setOpen(true)}
      >
        {trigger_label}
      </Button>
    );
  }

  if (state === "sent") {
    return (
      <p role="status" data-notify-sent className={cn("rounded-2xl border p-4 text-sm", className)}>
        {t("notify.sent")}
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      data-notify-form
      className={cn("relative flex flex-col gap-3 rounded-2xl border p-4 text-left", className)}
    >
      <FormHeading>{t(title_key)}</FormHeading>
      <Field id="notify-email" label={t("notify.email")}>
        <Input id="notify-email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field id="notify-note" label={t("notify.note")} hint={t("notify.note_hint")}>
        <Textarea id="notify-note" name="note" rows={3} aria-describedby="notify-note-hint" />
      </Field>
      <HoneypotField />
      <CheckLabel data-notify-consent>
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} aria-required />
        <span>
          <TokenLinks
            text={t("notify.consent", { privacy: "{privacy}" })}
            links={{ privacy: { route: PRIVACY_ROUTE, label: t("checkout.privacy_link") } }}
          />
        </span>
      </CheckLabel>
      {state === "invalid" && <FormError>{t("notify.invalid")}</FormError>}
      {state === "failed" && <FormError>{t("notify.failed")}</FormError>}
      <Button type="submit" disabled={state === "sending"}>
        {state === "sending" ? <Spinner className="size-4" /> : t("notify.send")}
      </Button>
    </form>
  );
}
