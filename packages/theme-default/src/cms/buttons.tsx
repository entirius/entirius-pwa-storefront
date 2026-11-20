// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Button } from "@theme/ui/button";
import { Link } from "@entirius/storefront-sdk/components/link";
import type { CmsButtonLook, CmsLink } from "@entirius/storefront-sdk/cms";

type Size = "sm" | "default" | "lg";

// One CMS button: a shop link, or a plain <a> for an external address. `look`: the part's default when the editor
// chose none.
export function CmsButton({ link, look, size = "sm" }: { link: CmsLink; look?: CmsButtonLook; size?: Size }) {
  const chosen = link.look ?? look ?? "default";
  return (
    <Button variant={chosen === "leading" ? "default" : chosen} size={size} className="px-5" asChild>
      {link.external ? (
        <a href={link.href} {...(link.new_tab && { target: "_blank", rel: "noopener noreferrer" })}>
          {link.label}
        </a>
      ) : (
        <Link href={link.href}>{link.label}</Link>
      )}
    </Button>
  );
}

// A row of CMS buttons.
export function CmsButtons({ links, look, size }: { links?: CmsLink[]; look?: CmsButtonLook; size?: Size }) {
  if (!links?.length) return null;
  return (
    <div data-cms-buttons className="flex flex-wrap gap-2">
      {links.map((link, i) => (
        <CmsButton key={`${i}-${link.href}`} link={link} look={look} size={size} />
      ))}
    </div>
  );
}
