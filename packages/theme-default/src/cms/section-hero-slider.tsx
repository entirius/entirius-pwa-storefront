// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Children } from "react";
import dynamic from "next/dynamic";
import type { CmsSectionHeroSliderProps } from "@entirius/storefront-sdk/cms";
import { cn } from "@theme/lib/utils";
import { FULL_BLEED_CLASS, is_full_width } from "@theme/lib/cms";

// The carousel only when there is something to slide: one slide is plain HTML.
const HeroCarousel = dynamic(() => import("@theme/cms/hero-carousel").then((m) => m.HeroCarousel));

// Slides (`tile-hero`): rounded cards across the page container, or across the viewport (the tiles drop their
// corners).
export function SectionHeroSlider({ width, children }: CmsSectionHeroSliderProps) {
  const slides = Children.toArray(children);
  if (!slides.length) return null;
  return (
    <section data-width={width} className={cn(is_full_width(width) ? FULL_BLEED_CLASS : "w-full")}>
      {slides.length === 1 ? slides[0] : <HeroCarousel>{slides}</HeroCarousel>}
    </section>
  );
}
