// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// GET agreements/v2/{channel}/definitions/ → the agreements a checkout can offer. The summary is the text the
// customer accepts (HTML, in the request's language); it is the definition's own wording, which the backend also
// keeps with the order, so the storefront shows it as it comes instead of a text of its own.

type AgreementDefinition = {
  slug: string;
  name: string;
  category: string; // "mandatory" | "marketing" | ...
  consent_channel: string; // "general" | "email" | "sms" | "push"
  content_route: string | null; // CMS route of the full text (terms, privacy)
  summary: string; // HTML
  sort_order: number;
};

type RawAgreementDefinition = {
  slug?: string;
  name?: string | null;
  category?: string | null;
  consent_channel?: string | null;
  content_route?: string | null;
  summary?: string | null;
  sort_order?: number | null;
};

// Definitions without a slug or a summary are left out: there is nothing to record or nothing to show.
function NORM_AGREEMENT_DEFINITIONS(resp: unknown): AgreementDefinition[] {
  const body = resp as { results?: RawAgreementDefinition[] } | RawAgreementDefinition[] | null | undefined;
  const list = Array.isArray(body) ? body : (body?.results ?? []);
  if (!Array.isArray(list)) return [];
  return list
    .filter((d) => d?.slug && d.summary)
    .map((d) => ({
      slug: String(d.slug),
      name: d.name ? String(d.name) : String(d.slug),
      category: d.category ? String(d.category) : "",
      consent_channel: d.consent_channel ? String(d.consent_channel) : "",
      content_route: String(d.content_route ?? "").replace(/^\/+/, "") || null,
      summary: String(d.summary),
      sort_order: Number(d.sort_order ?? 0) || 0,
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

// What the review step offers: the mandatory agreements, and the email marketing one, which goes through the
// newsletter's double opt-in (a guest cannot record a marketing consent directly).
function checkout_agreements(definitions: AgreementDefinition[]) {
  return {
    mandatory: definitions.filter((d) => d.category === "mandatory"),
    marketing_email: definitions.find((d) => d.category === "marketing" && d.consent_channel === "email") ?? null,
  };
}

// What the review step shows: nothing yet while the definitions are asked for, the backend's agreements when it has
// mandatory ones, else the shop's own consent line (nothing is recorded then).
function consent_source(
  definitions: AgreementDefinition[] | undefined,
  pending: boolean,
): "pending" | "backend" | "shop" {
  if (pending) return "pending";
  return checkout_agreements(definitions ?? []).mandatory.length > 0 ? "backend" : "shop";
}

// The agreements whose `content_route` is the page of a legal document.
const TERMS_SLUG = "terms-of-service";
const PRIVACY_SLUG = "privacy-policy";

// The CMS routes of the terms and the privacy policy: the definitions' `content_route`, the one place a deployment
// sets them; `fallback` (CHECKOUT.TERMS_ROUTE / PRIVACY_ROUTE of _CONFIG) only for a document without one.
function legal_routes(
  definitions: AgreementDefinition[] | undefined,
  fallback: { terms: string | undefined; privacy: string | undefined },
): { terms: string | undefined; privacy: string | undefined } {
  const route = (slug: string) => definitions?.find((d) => d.slug === slug)?.content_route ?? undefined;
  return { terms: route(TERMS_SLUG) ?? fallback.terms, privacy: route(PRIVACY_SLUG) ?? fallback.privacy };
}

export { NORM_AGREEMENT_DEFINITIONS, checkout_agreements, consent_source, legal_routes };
export type { AgreementDefinition };
