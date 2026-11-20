// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Children, type ReactNode } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@theme/ui/carousel";

// The hero slides in a looping carousel (the browser part of `section-hero-slider`).
export function HeroCarousel({ children }: { children: ReactNode }) {
  return (
    <Carousel opts={{ loop: true }} className="relative">
      <CarouselContent>
        {Children.map(children, (slide, i) => (
          <CarouselItem key={i}>{slide}</CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4" />
      <CarouselNext className="right-4" />
    </Carousel>
  );
}
