// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import {
  NORM_AGREEMENT_DEFINITIONS,
  checkout_agreements,
  consent_source,
  legal_routes,
  registration_agreements,
  registration_choice,
  signup_agreement_flags,
} from "./agreement.normalizer";
import { register_schema_for } from "../validation/auth.schema";

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

describe("registration_agreements", () => {
  const definitions = NORM_AGREEMENT_DEFINITIONS(answer);

  it("offers the mandatory agreements as required boxes and the email marketing one as an optional box", () => {
    expect(registration_agreements(definitions, true)?.map((a) => [a.slug, a.required])).toEqual([
      ["terms-of-service", true],
      ["privacy-policy", true],
      ["marketing-email", false],
    ]);
    expect(registration_agreements(definitions, true)?.[0].html).toBe('The <a href="/terms">Terms</a>');
  });

  it("leaves the marketing box out without a newsletter", () => {
    expect(registration_agreements(definitions, false)?.map((a) => a.slug)).toEqual(["terms-of-service", "privacy-policy"]);
  });

  it("is null without a mandatory agreement, so the shop's own boxes stay", () => {
    expect(registration_agreements([], true)).toBeNull();
    expect(registration_agreements(undefined, true)).toBeNull();
    expect(registration_agreements(definitions.filter((d) => d.category === "marketing"), true)).toBeNull();
  });
});

describe("registration choice", () => {
  const agreements = registration_agreements(NORM_AGREEMENT_DEFINITIONS(answer), true) ?? [];

  it("splits what was ticked into the consents to record and the newsletter", () => {
    expect(registration_choice(agreements, { "terms-of-service": true, "privacy-policy": true, "marketing-email": true })).toEqual({
      consents: ["terms-of-service", "privacy-policy"],
      newsletter: true,
    });
    expect(registration_choice(agreements, { "privacy-policy": true, "marketing-email": false })).toEqual({
      consents: ["privacy-policy"],
      newsletter: false,
    });
    expect(registration_choice(agreements, undefined)).toEqual({ consents: [], newsletter: false });
  });

  it("keeps the legacy signup flags: the shop's own pair, or the backend's agreements", () => {
    expect(signup_agreement_flags({ consent_terms: true, consent_data: true }, null)).toEqual({
      email: true,
      condition: true,
      newsletter: false,
    });
    expect(signup_agreement_flags({ accepted: { "marketing-email": true } }, agreements)).toEqual({
      email: true,
      condition: true,
      newsletter: false,
    });
    expect(signup_agreement_flags({ accepted: {} }, agreements).email).toBe(false);
  });
});

describe("register_schema_for", () => {
  const agreements = registration_agreements(NORM_AGREEMENT_DEFINITIONS(answer), true) ?? [];
  const base = { email: "a@example.com", password: "Passw0rd!!9", confirm_password: "Passw0rd!!9", consent_terms: false, consent_data: false };

  it("asks for every required agreement and names the box of the missing one", () => {
    const missing = register_schema_for(agreements).safeParse({ ...base, accepted: { "terms-of-service": true } });
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((i) => i.path.join("."))).toEqual(["accepted.privacy-policy"]);
    // A box never touched is undefined in the form's state: still the required-box message, not a type error.
    const untouched = register_schema_for(agreements).safeParse({ ...base, accepted: { "terms-of-service": true, "privacy-policy": undefined, "marketing-email": undefined } });
    expect(untouched.error?.issues.map((i) => i.path.join("."))).toEqual(["accepted.privacy-policy"]);
    const ok = register_schema_for(agreements).safeParse({ ...base, accepted: { "terms-of-service": true, "privacy-policy": true } });
    expect(ok.success).toBe(true);
  });

  it("keeps the shop's own pair required without agreements", () => {
    expect(register_schema_for(null).safeParse(base).success).toBe(false);
    expect(register_schema_for(null).safeParse({ ...base, consent_terms: true, consent_data: true }).success).toBe(true);
  });
});
