// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { create_api } from "@/API/api.context";
import { API_STOCK_ALERTS_CANCEL_ROUTE, API_STOCK_ALERTS_SUBSCRIBE_ROUTE } from "@/API/api.routes";
import { DEFAULT_PROFILE } from "@/lib/profile-path";
import { useHydrated } from "@/lib/use-hydrated";

type Api = ReturnType<typeof create_api>;

// Back-in-stock alerts (django_stock_alerts) are offered only when the channel has a stock-alerts key
// (`API_STOCK_ALERTS_KEY` in channels.config.json, sent by proxy.ts as the `sa_key` cookie). A client hook, like the
// contact forms: the server render of a product page never depends on it.
export function useStockAlertsAvailable(): boolean {
  const hydrated = useHydrated();
  return hydrated && document.cookie.includes("sa_key=");
}

export type StockAlertRequest = {
  email: string;
  sku: string;
  language: string;
  country: string;
  consent_text: string;
  website: string; // honeypot: the backend answers 201 and stores nothing when it is filled
};

export type SubscribeResult = "saved" | "in_stock" | "throttled" | "invalid" | "failed";

// 201 saved (new or already waiting), 409 IN_STOCK, 429 throttled or over the per-address cap, 400 invalid input;
// anything else, a network error included, is a failure.
const SUBSCRIBE_RESULTS: Record<number, SubscribeResult> = { 409: "in_stock", 429: "throttled", 400: "invalid" };

export async function subscribe_stock_alert(api: Api, request: StockAlertRequest): Promise<SubscribeResult> {
  const [error] = await api.FETCH_METHOD(API_STOCK_ALERTS_SUBSCRIBE_ROUTE, {
    method: "POST",
    body: JSON.stringify({ ...request, consent: true }),
  });
  if (!error) return "saved";
  return SUBSCRIBE_RESULTS[error.status ?? 0] ?? "failed";
}

// The cancel link of the alert mails (/stock-alert/cancel?token=): 200 also for an already closed request.
export async function cancel_stock_alert(api: Api, token: string): Promise<"cancelled" | "failed"> {
  const [error] = await api.FETCH_METHOD(API_STOCK_ALERTS_CANCEL_ROUTE, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  return error ? "failed" : "cancelled";
}

// The storefront country segment the alert link goes back to: "" for the default profile (no prefix).
export function country_segment(customer_country: string | undefined): string {
  if (!customer_country || customer_country === DEFAULT_PROFILE) return "";
  return /^[a-z]{2}$/i.test(customer_country) ? customer_country : "";
}

// The consent sentence as the person reads it: the message with its {privacy} token replaced by the link label, the
// way TokenLinks renders it. This exact text goes to the API as `consent_text`.
export const consent_sentence = (text: string, privacy_label: string) => text.replaceAll("{privacy}", privacy_label);
