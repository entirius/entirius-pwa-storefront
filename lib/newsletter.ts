// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { create_api } from "@/API/api.context";
import {
  API_NEWSLETTER_CONFIRM_ROUTE,
  API_NEWSLETTER_SUBSCRIBE_ROUTE,
  API_NEWSLETTER_UNSUBSCRIBE_ROUTE,
} from "@/API/api.routes";
import { useHydrated } from "@/lib/use-hydrated";

type Api = ReturnType<typeof create_api>;

// The newsletter (django_agreements, double opt-in) is offered only when the channel has a newsletter key
// (`API_NEWSLETTER_KEY` in channels.config.json, sent by proxy.ts as the `nl_key` cookie): subscribing without it
// answers 401. Confirming and unsubscribing need only the token from the mail.
export function useNewsletterAvailable(): boolean {
  const hydrated = useHydrated();
  return hydrated && document.cookie.includes("nl_key=");
}

// Starts the double opt-in: the backend mails a confirmation link. 201 does not say whether a mail went out.
export async function subscribe_newsletter(api: Api, email: string, language: string): Promise<boolean> {
  const [error] = await api.FETCH_METHOD(API_NEWSLETTER_SUBSCRIBE_ROUTE, {
    method: "POST",
    body: JSON.stringify({ email, language }),
  });
  return !error;
}

// The two links of the confirmation mail: /newsletter/confirm?token= and /newsletter/unsubscribe?token=.
export type NewsletterAction = "confirm" | "unsubscribe";

export async function newsletter_token_action(api: Api, action: NewsletterAction, token: string): Promise<boolean> {
  const [error] =
    action === "confirm"
      ? await api.FETCH_METHOD(API_NEWSLETTER_CONFIRM_ROUTE, { method: "POST", body: JSON.stringify({ token }) })
      : await api.FETCH_METHOD(API_NEWSLETTER_UNSUBSCRIBE_ROUTE, { querys: { token } });
  return !error;
}
