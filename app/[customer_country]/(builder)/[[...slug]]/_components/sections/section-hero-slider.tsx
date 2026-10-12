// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React from "react";
import dynamic from "next/dynamic";

// Carousel only when there is something to slide; one slide renders statically.
const HeroCarousel = dynamic(() => import("./hero-carousel.client"));

export default function SectionHeroSlider({
  children,
}: {
  width?: string;
  children?: React.ReactNode;
}) {
  const slides = React.Children.toArray(children);
  if (!slides.length) return null;
  return (
    // Slides are rounded cards: `width` (full_width or container) spans the page
    // container either way.
    <section className="w-full">
      {slides.length === 1 ? slides[0] : <HeroCarousel>{slides}</HeroCarousel>}
    </section>
  );
}
