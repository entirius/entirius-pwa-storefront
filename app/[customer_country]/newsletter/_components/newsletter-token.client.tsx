// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { MessagePage } from "@theme/components/message-page";
import { newsletter_token_action, type NewsletterAction } from "@/lib/newsletter";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

const TEXT = {
  confirm: { pending: "newsletter.confirming", title: "newsletter.confirmed_title", text: "newsletter.confirmed_text" },
  unsubscribe: {
    pending: "newsletter.unsubscribing",
    title: "newsletter.unsubscribed_title",
    text: "newsletter.unsubscribed_text",
  },
} as const;

// The receiver of a link from the newsletter mail (/newsletter/confirm?token=, /newsletter/unsubscribe?token=):
// sends the token once and reports the result. A missing token is an error known during render.
export function NewsletterTokenClient({ action }: { action: NewsletterAction }) {
  const { t } = useI18n();
  const token = useSearchParams().get("token");
  const api = useMemo(() => create_api(make_client_access()), []);
  const [status, setStatus] = useState<"pending" | "success" | "error">(() => (token ? "pending" : "error"));
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !token) return;
    fired.current = true;
    newsletter_token_action(api, action, token).then((ok) => setStatus(ok ? "success" : "error"));
  }, [api, action, token]);

  const text = TEXT[action];
  const ok = status === "success";
  // The data attribute names the result for tests and a theme's rules, whatever the theme's page draws.
  return (
    <div data-newsletter-result={status}>
      <MessagePage
        pending={status === "pending"}
        pending_text={t(text.pending)}
        title={ok ? t(text.title) : t("newsletter.link_failed_title")}
        text={ok ? t(text.text) : t("newsletter.link_failed_text")}
        action={{ label: t("common.back_to_store"), href: "/" }}
      />
    </div>
  );
}
