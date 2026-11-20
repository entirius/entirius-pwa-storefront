// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Link } from "./link";

// What each `{token}` of a text stands for: its label, linked to a CMS page route when the route is set.
export type TokenLinksMap = Record<string, { route: string | undefined; label: string }>;

// Text with `{token}` placeholders; each token named in `links` is replaced by its label, as a link to a CMS page
// route (new tab) when the route is set and as plain text when it is not.
export function TokenLinks({ text, links }: { text: string; links: TokenLinksMap }) {
  return text.split(/(\{\w+\})/).map((part, i) => {
    const link = links[part.slice(1, -1)];
    if (!link || !part.startsWith("{")) return part;
    if (!link.route) return link.label;
    return (
      <Link key={i} href={`/${link.route}`} className="underline" target="_blank">
        {link.label}
      </Link>
    );
  });
}
