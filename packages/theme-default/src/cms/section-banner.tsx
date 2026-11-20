// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsSectionBannerProps } from "@entirius/storefront-sdk/cms";
import { cn } from "@theme/lib/utils";
import { FULL_BLEED_CLASS, is_full_width } from "@theme/lib/cms";
import { TileHero } from "@theme/cms/tile-hero";

// A promo strip: one picture with copy and buttons, drawn as the hero tile's banner shape. Full width spans the
// viewport, square-cornered.
export function SectionBanner({ width, spaced, ...banner }: CmsSectionBannerProps) {
  return (
    <section data-width={width} className={cn(is_full_width(width) ? FULL_BLEED_CLASS : "w-full", spaced && "py-6")}>
      <TileHero {...banner} dye={4} shape="banner" width={width} />
    </section>
  );
}
