// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, type CSSProperties, type JSX } from "react";
import { sanitize_html } from "./sanitize-html";

// HTML from the API, sanitized on every render path: the server render as well as the browser. It must never reach
// dangerouslySetInnerHTML raw; the server-rendered markup is what the browser parses first.
export function RichText({
  html,
  className,
  style,
  as: Tag = "div",
  new_tab_links = false,
}: {
  html: string;
  className?: string;
  style?: CSSProperties;
  as?: keyof JSX.IntrinsicElements;
  // true: external links open in a new tab; "all": every link.
  new_tab_links?: boolean | "all";
}) {
  const clean = useMemo(() => sanitize_html(html, { new_tab_links }), [html, new_tab_links]);
  return <Tag data-rich-text="" className={className} style={style} dangerouslySetInnerHTML={{ __html: clean }} />;
}
