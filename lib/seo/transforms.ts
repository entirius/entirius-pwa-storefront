// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { _LOGGER } from "@/lib/logger";
import { resolve_media_url } from "@/utils/media-url";

// ------------------------------------------------------------
// Transforms a config field applies to the value read from its source:
//   [outKey, source, transform]
// `transform` is a name or a list of names applied left to right; a name may
// carry one argument after a colon ("truncate:160"). A transform that cannot
// use the value returns undefined, so the field drops out instead of putting
// raw data (HTML, a bare media path) into the page head.
// ------------------------------------------------------------
export type SeoTransform = string | string[];

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

// Tags that end a line of text; any other tag sits inside one ("<strong>week</strong>." stays "week.").
const BLOCK_TAG = /<\/?(?:address|article|aside|blockquote|br|dd|div|dl|dt|figcaption|figure|footer|h[1-6]|header|hr|li|ol|p|pre|section|table|td|th|tr|ul)\b[^>]*>/gi;

// HTML → one line of plain text: script/style bodies and tags dropped,
// entities decoded in one pass (so "&amp;lt;" stays "&lt;"), whitespace collapsed.
export function plain_text(html: string): string {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(BLOCK_TAG, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? entity;
      const point = /^#x/i.test(code) ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    })
    .replace(/\s+/g, " ")
    .trim();
}

// At most `max` characters, cut on a word boundary when one is near, with an ellipsis.
export function truncate_text(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:!?-]+$/, "")}…`;
}

type MediaSource = { source?: unknown; width?: unknown };
type Media = { type?: unknown; position?: unknown; source_set?: unknown };

// The widest source of one picture, as an absolute URL.
function widest_source(source_set: unknown): string | undefined {
  const sources = (Array.isArray(source_set) ? source_set : []) as MediaSource[];
  const best = sources
    .filter((s) => typeof s?.source === "string" && s.source !== "")
    .reduce<MediaSource | undefined>((a, s) => (!a || Number(s.width) > Number(a.width) ? s : a), undefined);
  return resolve_media_url(best?.source as string | undefined) || undefined;
}

// media[] (or one media object, e.g. `main_image`) → the widest source of each
// picture by position; videos skipped. filter() copies, so sort() leaves the API data as it was.
function media_urls(value: unknown): string[] {
  const list = (Array.isArray(value) ? value : value && typeof value === "object" ? [value] : []) as Media[];
  return list
    .filter((m) => m && typeof m === "object" && m.type !== "video")
    .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
    .map((m) => widest_source(m.source_set))
    .filter((url): url is string => !!url);
}

const TRANSFORMS: Record<string, (value: unknown, arg?: string) => unknown> = {
  strip_html: (v) => (typeof v === "string" ? plain_text(v) : undefined),
  truncate: (v, arg) => (typeof v === "string" ? truncate_text(v, Number(arg) || 160) : undefined),
  media_urls,
  // The first `arg` items of a list (default 1), e.g. one share image for the page head.
  take: (v, arg) => (Array.isArray(v) ? v.slice(0, Number(arg) || 1) : undefined),
  // A media path (category image) → absolute URL on the API host.
  absolute_url: (v) => (typeof v === "string" ? resolve_media_url(v) || undefined : undefined),
  // `on_stock` → schema.org Offer.availability.
  availability: (v) => (typeof v === "boolean" ? `https://schema.org/${v ? "InStock" : "OutOfStock"}` : undefined),
  upper: (v) => (typeof v === "string" ? v.toUpperCase() : undefined),
};

// Run a field's transform(s) on its value. An unknown name is a config error:
// logged, and the field drops out.
export function apply_transform(value: unknown, transform: SeoTransform | undefined): unknown {
  if (!transform) return value;
  let out = value;
  for (const step of Array.isArray(transform) ? transform : [transform]) {
    const [name, arg] = step.split(":", 2);
    const run = TRANSFORMS[name];
    if (!run) {
      _LOGGER({ message: `SEO: unknown transform "${name}"`, type: "warning" });
      return undefined;
    }
    out = run(out, arg);
  }
  return out;
}
