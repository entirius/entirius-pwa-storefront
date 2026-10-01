"use client";
import DOMPurify from "isomorphic-dompurify";
import { useMemo } from "react";

// Sanitizes on every render path: the server render (jsdom) as well as the
// browser. HTML from the API must never reach dangerouslySetInnerHTML raw — the
// server-rendered markup is what the browser parses first.
export function SanitizeHTML({
  html,
  className,
  style,
  as: Tag = "div",
}: {
  html: string;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const clean = useMemo(() => DOMPurify.sanitize(html), [html]);
  return (
    <Tag
      data-rich-text=""
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
