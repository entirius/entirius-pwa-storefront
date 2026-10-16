// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { FULL_BLEED_CLASS, is_full_width } from "../cms-width";

// Carousel only when there is something to slide; one slide renders statically.
const HeroCarousel = dynamic(() => import("./hero-carousel.client"));

export default function SectionHeroSlider({
  width,
  children,
}: {
  width?: string;
  children?: React.ReactNode;
}) {
  const slides = React.Children.toArray(children);
  if (!slides.length) return null;
  return (
    // `container`: rounded cards across the page container; `full_width`: the slides
    // span the viewport (the tiles drop their corners).
    <section
      data-width={is_full_width(width) ? "full_width" : "container"}
      className={cn(is_full_width(width) ? FULL_BLEED_CLASS : "w-full")}
    >
      {slides.length === 1 ? slides[0] : <HeroCarousel>{slides}</HeroCarousel>}
    </section>
  );
}
