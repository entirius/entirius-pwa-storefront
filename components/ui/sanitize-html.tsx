// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import { useMemo } from "react";
import { sanitize_html } from "@/lib/sanitize-html";

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
  // External links open in a new tab.
  new_tab_links?: boolean;
}) {
  const clean = useMemo(() => sanitize_html(html, { new_tab_links }), [html, new_tab_links]);
  return (
    <Tag
      data-rich-text=""
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
