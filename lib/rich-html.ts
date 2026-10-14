// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { STORY_ATTRIBUTES } from "@/lib/product-config";

const HAS_TAG = /<\/?[a-z][\s\S]*>/i;

// Product text arrives as HTML (`<p>`, `<br>`) but a plain-text description is possible too: blank lines
// become paragraphs and single line breaks `<br>`, so the owner's paragraphs survive either way.
export function description_html(text: string): string {
  if (HAS_TAG.test(text)) return text;
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escape(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

type Attribute = { feature_idx?: string; feature_type?: string; value?: string | null; is_visible?: boolean };

// A long-text attribute shown as its own section after the specification: a TEXT attribute whose value is
// HTML, or one listed in `PRODUCT.STORY_ATTRIBUTES`. The API has no rich-text attribute type of its own.
export function is_story(a: Attribute, listed: string[] = STORY_ATTRIBUTES): boolean {
  if (!a.is_visible || !a.value) return false;
  if (a.feature_idx && listed.includes(a.feature_idx)) return true;
  return ["TEXT", "TEXT_T9N"].includes(a.feature_type ?? "") && HAS_TAG.test(a.value);
}
