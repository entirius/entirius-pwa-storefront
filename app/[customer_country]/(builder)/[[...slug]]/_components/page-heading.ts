// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsDocumentContent, CmsPage, CmsSectionData } from "@/types/cms.types";

const OWN_H1 = /<h1[\s>]/i;

const has_own_h1 = (tile: CmsSectionData) =>
  typeof tile.description === "string" && OWN_H1.test(tile.description);

// The page's public title is `meta.title`; the document's `name` is the editors' label (a legal page's is
// "Terms (EN)"), so it only stands in when there is no title.
export const page_title = (page: Pick<CmsPage, "name" | "meta">): string | null =>
  page.meta?.title?.trim() || page.name?.trim() || null;

// A text whose HTML opens its own H1 (a legal page: the whole text is in one tile) is the page's heading: the
// page adds no hidden H1 and the tile prints no title above it, so the page has one H1 and says it once.
export function own_heading_content(content: CmsDocumentContent): { has_h1: boolean; content: CmsDocumentContent } {
  const tiles = Object.entries(content.tiles ?? {});
  if (!tiles.some(([, tile]) => has_own_h1(tile))) return { has_h1: false, content };
  const without_title = tiles.map(([id, tile]) => [id, has_own_h1(tile) ? { ...tile, title: undefined } : tile]);
  return { has_h1: true, content: { ...content, tiles: Object.fromEntries(without_title) } };
}
