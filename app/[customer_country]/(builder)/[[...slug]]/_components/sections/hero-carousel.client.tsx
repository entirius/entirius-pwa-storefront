"use client";

import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function HeroCarousel({ children }: { children: React.ReactNode }) {
  return (
    <Carousel opts={{ loop: true }} className="relative">
      <CarouselContent>
        {React.Children.map(children, (slide, i) => (
          <CarouselItem key={i}>{slide}</CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4" />
      <CarouselNext className="right-4" />
    </Carousel>
  );
}
