// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import DOMPurify from "isomorphic-dompurify";
import { useMemo } from "react";
import { external_links } from "@/lib/rich-html";

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
  // External links open in a new tab (done after sanitising: DOMPurify drops `target`).
  new_tab_links?: boolean;
}) {
  const clean = useMemo(() => {
    const safe = DOMPurify.sanitize(html);
    return new_tab_links ? external_links(safe) : safe;
  }, [html, new_tab_links]);
  return (
    <Tag
      data-rich-text=""
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
