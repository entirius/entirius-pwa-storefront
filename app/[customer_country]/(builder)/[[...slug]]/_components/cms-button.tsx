// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { Button } from "@/components/ui/button";
import { LinkDynamic } from "@/lib/link-dynamic";
import { link_target, url_key_query } from "@/lib/url-keys";
import { useI18n } from "@/providers/i18n.provider";

// `internal` is what the CMS editor saves (`custom_buttons[].type`), with the
// CMS link convention in `url`: `/p/<url_key>` product, `/c/<url_key>` category,
// anything else a CMS page route. The other types are explicit targets.
export type CmsButtonType = "internal" | "catalog" | "product" | "cms" | "external";

export type CmsButtonDye =
  | "default"
  | "leading"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export interface CmsButtonData {
  url: string;
  label: string;
  type: CmsButtonType;
  dye?: CmsButtonDye;
}

// CMS link convention → storefront route (country prefix added by LinkDynamic).
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

export default function CmsButton({
  button,
  size = "sm",
}: {
  button: CmsButtonData;
  size?: "sm" | "default" | "lg";
}) {
  const { url, label, type, dye = "default" } = button;
  const { language } = useI18n();
  const api = useMemo(() => create_api(make_client_access()), []);
  // Catalog / product links resolve to the active language's url key (cached; the page prefetches them on the server).
  const target = link_target(type, url);
  const { data: key } = useQuery({
    ...url_key_query(api, language, target?.kind ?? "product", target?.key ?? ""),
    enabled: !!target,
  });
  if (!label || !url) return null;
  const href = resolve_cms_href(type, url, key);
  const variant = dye === "leading" ? "default" : dye;

  if (type === "external") {
    // A bare "#fragment" is an in-page link (for example the cookie preferences marker): same tab.
    const new_tab = !url.startsWith("#");
    return (
      <Button variant={variant} size={size} className="rounded-full px-5" asChild>
        <a
          href={href}
          {...(new_tab && { target: "_blank", rel: "noopener noreferrer" })}
        >
          {label}
        </a>
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} className="rounded-full px-5" asChild>
      <LinkDynamic href={href}>{label}</LinkDynamic>
    </Button>
  );
}

export function CmsButtons({
  buttons,
  variant,
  size,
}: {
  buttons?: CmsButtonData[];
  // Default look when the button carries no `dye` (the editor saves none).
  variant?: CmsButtonDye;
  size?: "sm" | "default" | "lg";
}) {
  if (!buttons?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((button, i) => (
        <CmsButton key={`${i}-${button.url}`} button={{ dye: variant, ...button }} size={size} />
      ))}
    </div>
  );
}
