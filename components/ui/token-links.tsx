// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { LinkDynamic } from "@/lib/link-dynamic";

// Text with `{token}` placeholders; each token named in `links` is replaced by its label, as a link
// to a CMS page route (new tab) when the route is set and as plain text when it is not.
export function TokenLinks({
  text,
  links,
}: {
  text: string;
  links: Record<string, { route: string | undefined; label: string }>;
}) {
  return text.split(/(\{\w+\})/).map((part, i) => {
    const link = links[part.slice(1, -1)];
    if (!link || !part.startsWith("{")) return part;
    if (!link.route) return link.label;
    return (
      <LinkDynamic key={i} href={`/${link.route}`} className="underline" target="_blank">
        {link.label}
      </LinkDynamic>
    );
  });
}
