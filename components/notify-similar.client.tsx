// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, useState } from "react";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { HONEYPOT_NAME } from "@theme/ui/honeypot-field";
import { NotifySimilarForm } from "@theme/forms/notify-similar-form";
import type { SendState } from "@entirius/storefront-sdk/forms";
import { useLegalRoutes } from "@/lib/agreements";
import { is_email, send_contact_form, useContactFormAvailable } from "@/lib/contact-forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import type { MessageKey } from "@entirius/storefront-sdk/i18n";

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

type State = SendState;

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
  const legal = useLegalRoutes();
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

  return (
    <NotifySimilarForm
      state={state}
      submit={submit}
      className={className}
      title={t(title_key)}
      open={open}
      open_form={() => setOpen(true)}
      trigger_label={trigger_label}
      consent={{
        checked: consent,
        set: setConsent,
        text: t("notify.consent", { privacy: "{privacy}" }),
        links: { privacy: { route: legal.privacy, label: t("checkout.privacy_link") } },
      }}
    />
  );
}
