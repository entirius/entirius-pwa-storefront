import React from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

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
    // full_width bleeds out of <main>'s padding (p-4).
    <section className={cn(width === "full_width" ? "-mx-4 -mt-4" : "mx-auto w-full max-w-6xl")}>
      {slides.length === 1 ? slides[0] : <HeroCarousel>{slides}</HeroCarousel>}
    </section>
  );
}
