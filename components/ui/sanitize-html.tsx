"use client";
import DOMPurify from "dompurify";
import { useMemo } from "react";

export function SanitizeHTML({
  html,
  className,
  as: Tag = "div",
}: {
  html: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const clean = useMemo(
    () => (typeof window !== "undefined" ? DOMPurify.sanitize(html) : html),
    [html],
  );
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
