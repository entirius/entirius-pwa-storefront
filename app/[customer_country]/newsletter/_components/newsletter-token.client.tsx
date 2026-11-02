// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LinkDynamic } from "@/lib/link-dynamic";
import { newsletter_token_action, type NewsletterAction } from "@/lib/newsletter";
import { useI18n } from "@/providers/i18n.provider";

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
  return (
    <div data-newsletter-result={status} className="mx-auto max-w-3xl px-4 py-16 text-center">
      {status === "pending" ? (
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-6" />
          <p className="text-muted-foreground">{t(text.pending)}</p>
        </div>
      ) : (
        <>
          <h1 className="mb-3 text-2xl">
            {status === "success" ? t(text.title) : t("newsletter.link_failed_title")}
          </h1>
          <p className="mb-6 text-muted-foreground">
            {status === "success" ? t(text.text) : t("newsletter.link_failed_text")}
          </p>
          <Button asChild variant="outline">
            <LinkDynamic href="/">{t("common.back_to_store")}</LinkDynamic>
          </Button>
        </>
      )}
    </div>
  );
}
