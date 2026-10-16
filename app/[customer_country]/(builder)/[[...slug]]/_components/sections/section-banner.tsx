// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cn } from "@/lib/utils";
import { FULL_BLEED_CLASS, is_full_width } from "../cms-width";
import TileHero from "../tiles/tile-hero";
import type { CmsButtonData } from "../cms-button";
import type { CmsImagesSet } from "../cms-image";

// Promo banner: one image with copy and a button, no tiles. `margin: false`
// drops the vertical spacing; `width: full_width` spans the viewport, square-cornered.
export default function SectionBanner({
  width,
  margin,
  ...banner
}: {
  width?: string;
  margin?: boolean | string;
  title?: string;
  description?: string;
  images_set?: CmsImagesSet;
  custom_buttons?: CmsButtonData[];
  tile_align?: string;
  dye?: number;
}) {
  return (
    <section
      data-width={is_full_width(width) ? "full_width" : "container"}
      className={cn(
        is_full_width(width) ? FULL_BLEED_CLASS : "w-full",
        String(margin) !== "false" && "py-6",
      )}
    >
      <TileHero {...banner} shape="banner" section_width={width} />
    </section>
  );
}
