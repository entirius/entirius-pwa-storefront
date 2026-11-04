// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_AGREEMENT_DEFINITIONS, checkout_agreements, consent_source, legal_routes } from "./agreement.normalizer";

// The shape answered by django-agreements 3.0 for the seeded channel (summaries shortened).
const answer = {
  count: 4,
  results: [
    { slug: "marketing-email", name: "Email", category: "marketing", consent_channel: "email", content_route: "", summary: "Email offers", sort_order: 10 },
    { slug: "privacy-policy", name: "Privacy", category: "mandatory", consent_channel: "general", content_route: "privacy", summary: 'The <a href="/privacy">Privacy Policy</a>', sort_order: 2 },
    { slug: "terms-of-service", name: "Terms", category: "mandatory", consent_channel: "general", content_route: "terms", summary: 'The <a href="/terms">Terms</a>', sort_order: 1 },
    { slug: "marketing-sms", name: "SMS", category: "marketing", consent_channel: "sms", content_route: "", summary: "SMS offers", sort_order: 11 },
  ],
};

describe("NORM_AGREEMENT_DEFINITIONS", () => {
  it("keeps the backend order of the definitions and their wording", () => {
    const definitions = NORM_AGREEMENT_DEFINITIONS(answer);
    expect(definitions.map((d) => d.slug)).toEqual([
      "terms-of-service",
      "privacy-policy",
      "marketing-email",
      "marketing-sms",
    ]);
    expect(definitions[0]).toMatchObject({ content_route: "terms", summary: 'The <a href="/terms">Terms</a>' });
    expect(definitions[2].content_route).toBeNull();
  });

  it("leaves out a definition without a slug or a summary, and an answer that is not a list", () => {
    expect(NORM_AGREEMENT_DEFINITIONS({ results: [{ slug: "x" }, { summary: "y" }] })).toEqual([]);
    expect(NORM_AGREEMENT_DEFINITIONS({ detail: "x" })).toEqual([]);
    expect(NORM_AGREEMENT_DEFINITIONS(null)).toEqual([]);
  });
});

describe("checkout_agreements", () => {
  it("offers the mandatory agreements and the email marketing one", () => {
    const { mandatory, marketing_email } = checkout_agreements(NORM_AGREEMENT_DEFINITIONS(answer));
    expect(mandatory.map((d) => d.slug)).toEqual(["terms-of-service", "privacy-policy"]);
    expect(marketing_email?.slug).toBe("marketing-email");
  });

  it("has nothing to offer without definitions", () => {
    expect(checkout_agreements([])).toEqual({ mandatory: [], marketing_email: null });
  });
});

describe("consent_source", () => {
  const definitions = NORM_AGREEMENT_DEFINITIONS(answer);

  it("waits for the definitions, then shows the backend's agreements", () => {
    expect(consent_source(undefined, true)).toBe("pending");
    expect(consent_source(definitions, false)).toBe("backend");
  });

  it("falls back to the shop's own line without an answer or without a mandatory agreement", () => {
    expect(consent_source(undefined, false)).toBe("shop");
    expect(consent_source(definitions.filter((d) => d.category !== "mandatory"), false)).toBe("shop");
  });
});

describe("legal_routes", () => {
  const config = { terms: "regulamin", privacy: "polityka" };

  it("takes the routes the agreement definitions name", () => {
    expect(legal_routes(NORM_AGREEMENT_DEFINITIONS(answer), config)).toEqual({ terms: "terms", privacy: "privacy" });
  });

  it("takes the configured routes without definitions or without a route in them", () => {
    expect(legal_routes(undefined, config)).toEqual(config);
    const no_route = NORM_AGREEMENT_DEFINITIONS({ results: [{ slug: "privacy-policy", summary: "x", content_route: "" }] });
    expect(legal_routes(no_route, config)).toEqual(config);
  });

  it("drops a leading slash of a route", () => {
    const slashed = NORM_AGREEMENT_DEFINITIONS({ results: [{ slug: "terms-of-service", summary: "x", content_route: "/terms" }] });
    expect(legal_routes(slashed, config).terms).toBe("terms");
  });
});
