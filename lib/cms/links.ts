// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsButtonLook, CmsLink } from "@entirius/storefront-sdk/cms";
import { link_target } from "@/lib/url-keys";

// `internal` is what the CMS editor saves (`custom_buttons[].type`), with the CMS link convention in `url`:
// `/p/<url_key>` product, `/c/<url_key>` category, anything else a CMS page route. The other types are explicit
// targets.
export type CmsButtonType = "internal" | "catalog" | "product" | "cms" | "external";

const TYPES = new Set<string>(["internal", "catalog", "product", "cms", "external"]);
const LOOKS = new Set<string>(["default", "leading", "destructive", "outline", "secondary", "ghost", "link"]);

// CMS link convention → storefront route (the country prefix comes from <Link>).
function resolve_internal(url: string): string {
  const path = url.startsWith("/") ? url : `/${url}`;
  const [, prefix, key] = path.match(/^\/(p|c)\/?([^/?#]*)/) ?? [];
  if (prefix === "p" && key) return `/product/${key}`;
  // `/c/` with no key has no catalog root to land on — the home page lists categories.
  if (prefix === "c") return key ? `/catalog/${key}` : "/";
  return path;
}

// `key`: the active language's url key of the catalog / product the button points at (replaces the typed one).
export function resolve_cms_href(type: CmsButtonType, url: string, key?: string): string {
  switch (type) {
    case "internal": {
      const target = link_target(type, url);
      return key && target ? `/${target.kind === "product" ? "product" : "catalog"}/${key}` : resolve_internal(url);
    }
    case "catalog":
      return `/catalog/${key ?? url}`;
    case "product":
      return `/product/${key ?? url}`;
    case "cms":
      return `/${url}`;
    case "external":
      return url;
  }
}

// The editor's buttons (`custom_buttons`, `buttons`: `[{ url, label, type, dye }]`) with their addresses;
// `keys`: the active language's url keys, by `<kind>:<typed key>`. A button without a label or an address is left
// out.
export function cms_links(value: unknown, keys: ReadonlyMap<string, string>): CmsLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row): CmsLink[] => {
    const { url, label, type, dye } = (row ?? {}) as Record<string, unknown>;
    if (typeof url !== "string" || !url || typeof label !== "string" || !label) return [];
    const kind: CmsButtonType = typeof type === "string" && TYPES.has(type) ? (type as CmsButtonType) : "internal";
    const target = link_target(kind, url);
    const href = resolve_cms_href(kind, url, target ? keys.get(`${target.kind}:${target.key}`) : undefined);
    const external = kind === "external";
    return [
      {
        label,
        href,
        external,
        // A bare "#fragment" is an in-page link (for example the cookie preferences marker): same tab.
        new_tab: external && !url.startsWith("#"),
        look: typeof dye === "string" && LOOKS.has(dye) ? (dye as CmsButtonLook) : null,
      },
    ];
  });
}
