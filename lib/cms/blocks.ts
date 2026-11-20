// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsPicture, CmsPictures, CmsWidth } from "@entirius/storefront-sdk/cms";
import type { CmsImageSetVariant, CmsImagesSet } from "@/types/cms.types";

// Editor values → what the theme's CMS parts take. Fields of a block are untyped JSON: every reader checks.

export const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

// The section option `width`: `full_width`, anything else (or nothing) the page container.
export const cms_width = (value: unknown): CmsWidth => (value === "full_width" ? "full_width" : "container");

// The editor's `margin` switch, on unless saved as false.
export const spaced = (value: unknown): boolean => String(value) !== "false";

// A number option (`dye`, `variant`), else the given default.
export const option = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

function picture(variant: CmsImageSetVariant | undefined): CmsPicture | null {
  if (!variant?.image || typeof variant.image !== "string") return null;
  return {
    // A backend `/media/...` path, like PIM media: <Media> sends it to the API host.
    src: variant.image,
    width: variant.width ?? null,
    height: variant.height ?? null,
    alt: variant.meta?.alt ?? variant.meta?.fileName ?? "",
  };
}

// Both versions of a block's picture; null when the block has none.
export function cms_pictures(value: unknown): CmsPictures | null {
  const set = value && typeof value === "object" ? (value as CmsImagesSet) : null;
  const desktop = picture(set?.desktop);
  const mobile = picture(set?.mobile);
  return desktop || mobile ? { desktop, mobile } : null;
}

// One picture: the desktop version, else the mobile one.
export function cms_picture(value: unknown): CmsPicture | null {
  const pictures = cms_pictures(value);
  return pictures ? (pictures.desktop ?? pictures.mobile) : null;
}
