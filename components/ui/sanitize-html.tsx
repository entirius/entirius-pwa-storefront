// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import { createContext, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { sanitize_html } from "@/lib/sanitize-html";

type Navigate = (href: string) => void;

const ClientNavigationContext = createContext<Navigate | null>(null);

// Rich text below it follows internal links with the client router. Outside it, links are left to the browser.
export function ClientNavigation({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return <ClientNavigationContext value={router.push}>{children}</ClientNavigationContext>;
}

function internal_link_url(event: React.MouseEvent): URL | null {
  const link = (event.target as Element).closest?.("a");
  if (!link || !event.currentTarget.contains(link)) return null;
  if (!link.hasAttribute("href") || link.hasAttribute("download")) return null;
  if (link.target && link.target !== "_self") return null;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return null;
  return url;
}

function is_plain_click(event: React.MouseEvent) {
  return event.button === 0 && !event.defaultPrevented && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
}

// Sanitizes on every render path: the server render (jsdom) as well as the
// browser. HTML from the API must never reach dangerouslySetInnerHTML raw — the
// server-rendered markup is what the browser parses first.
export function SanitizeHTML({
  html,
  className,
  style,
  as: Tag = "div",
  new_tab_links = false,
}: {
  html: string;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof React.JSX.IntrinsicElements;
  // true: external links open in a new tab; "all": every link.
  new_tab_links?: boolean | "all";
}) {
  const navigate = useContext(ClientNavigationContext);
  const clean = useMemo(() => sanitize_html(html, { new_tab_links }), [html, new_tab_links]);
  const on_click = (event: React.MouseEvent) => {
    if (!is_plain_click(event)) return;
    const url = internal_link_url(event);
    if (!url) return;
    event.preventDefault();
    navigate?.(url.pathname + url.search + url.hash);
  };
  return (
    <Tag
      onClick={navigate ? on_click : undefined}
      data-rich-text=""
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
