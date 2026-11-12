// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useParams: () => ({ customer_country: "default" }) }));

import { make_static_access } from "@/API/access/api.static-access";
import { create_api } from "@/API/api.context";
import { TokenLinks } from "@/components/ui/token-links";
import { en } from "@/lib/i18n/messages/en";
import { pl } from "@/lib/i18n/messages/pl";
import { cancel_stock_alert, consent_sentence, country_segment, subscribe_stock_alert } from "./stock-alerts";

const api = () => create_api(make_static_access({ channel: "eu", language: "en" }));
const REQUEST = { email: "ann@example.com", sku: "TEE-M", language: "en", country: "pl", consent_text: "I agree", website: "" };

function answer(status: number, body: unknown = {}) {
  const fetch = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("subscribe_stock_alert", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    [201, "saved"],
    [409, "in_stock"],
    [429, "throttled"],
    [400, "invalid"],
    [500, "failed"],
    [404, "failed"],
  ] as const)("maps %i to %s", async (status, result) => {
    answer(status, status === 201 ? { status: "saved" } : { error: "X" });
    expect(await subscribe_stock_alert(api(), REQUEST)).toBe(result);
  });

  it("reports a network error as failed", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    expect(await subscribe_stock_alert(api(), REQUEST)).toBe("failed");
  });

  it("posts the request with consent to the channel's route", async () => {
    const fetch = answer(201);
    await subscribe_stock_alert(api(), REQUEST);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toContain("/api/stock-alerts/v2/eu/subscriptions/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ ...REQUEST, consent: true });
  });
});

describe("cancel_stock_alert", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts the token and reads 200 as cancelled, anything else as failed", async () => {
    const fetch = answer(200, { status: "cancelled" });
    expect(await cancel_stock_alert(api(), "tok")).toBe("cancelled");
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toContain("/api/stock-alerts/v2/eu/subscriptions/cancel/");
    expect(JSON.parse(String(init.body))).toEqual({ token: "tok" });
    answer(400);
    expect(await cancel_stock_alert(api(), "bad")).toBe("failed");
  });
});

describe("consent_sentence", () => {
  const text_of = (html: string) => html.replace(/<[^>]+>/g, "");

  it.each([["en", en], ["pl", pl]] as const)("equals the rendered consent label (%s)", (_, messages) => {
    const template = messages["stockAlert.consent"] as string;
    const label = messages["checkout.privacy_link"] as string;
    for (const route of ["privacy-policy", undefined]) {
      const html = renderToStaticMarkup(createElement(TokenLinks, { text: template, links: { privacy: { route, label } } }));
      expect(text_of(html)).toBe(consent_sentence(template, label));
    }
  });
});

describe("country_segment", () => {
  it("keeps a two-letter country and empties the default profile", () => {
    expect(country_segment("pl")).toBe("pl");
    expect(country_segment("default")).toBe("");
    expect(country_segment(undefined)).toBe("");
    expect(country_segment("europe")).toBe("");
  });
});
