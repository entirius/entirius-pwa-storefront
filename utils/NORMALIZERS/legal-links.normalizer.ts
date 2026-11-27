// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// The published `legal-page` documents → the links of the footer's bottom bar. The label is the page's public title
// (`meta.title`); `name` is the editors' own label ("Terms (EN)") and never reaches a visitor. A page without a
// route or a title has nothing to link or to call it by and is left out.

import type { FooterLink } from "./footer.normalizer";

type RawLegalPage = { routes?: unknown; meta?: { title?: unknown } | null };

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function NORM_LEGAL_LINKS(response: unknown): FooterLink[] {
  const pages = (response as { data?: unknown } | null | undefined)?.data;
  if (!Array.isArray(pages)) return [];
  return (pages as RawLegalPage[]).flatMap((page) => {
    const route = Array.isArray(page?.routes) ? text(page.routes[0]).replace(/^\/+/, "") : "";
    const label = text(page?.meta?.title);
    return route && label ? [{ label, href: `/${route}`, external: false }] : [];
  });
}
