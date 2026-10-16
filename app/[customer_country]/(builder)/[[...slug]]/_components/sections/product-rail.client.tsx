// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Product cards of a CMS product section: `grid: slider` scrolls one row,
// anything else is a grid.
export function ProductRail({
  layout,
  children,
}: {
  layout?: string;
  children?: React.ReactNode;
}) {
  const items = React.Children.toArray(children);
  if (!items.length) return null;

  if (layout === "slider") {
    return (
      <Carousel opts={{ align: "start" }} className="relative">
        <CarouselContent>
          {items.map((item, i) => (
            <CarouselItem key={i} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
              {item}
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-3 hidden md:flex" />
        <CarouselNext className="-right-3 hidden md:flex" />
      </Carousel>
    );
  }

  return <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{items}</div>;
}
