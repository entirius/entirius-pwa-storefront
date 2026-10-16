// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/ui/media-image.client";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n.provider";
import { GalleryViewer } from "./gallery-viewer.client";
import { scroll_behavior, slide_index, type GalleryMedia } from "./gallery-utils";

// Phone: a swipeable scroll-snap row with a "3 / 12" counter. Desktop: the same row plus arrows and a thumbnail
// strip. A tap / click opens the full-screen viewer. Slides are fixed square boxes: nothing jumps while loading.
export function Gallery({ media, name }: { media: GalleryMedia; name: string }) {
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(false);
  const count = media.length;

  const go = useCallback(
    (to: number, behavior: ScrollBehavior = scroll_behavior()) => {
      const el = track.current;
      if (el) el.scrollTo({ left: Math.max(0, Math.min(count - 1, to)) * el.clientWidth, behavior });
    },
    [count],
  );

  // Another variant brings other pictures: start from the first one.
  useEffect(() => {
    go(0, "auto");
  }, [media, go]);

  const on_key = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") go(index - 1);
    if (e.key === "ArrowRight") go(index + 1);
  };

  return (
    <div
      data-gallery
      onKeyDown={on_key}
      className="surface-sm md:sticky md:top-24 md:self-start"
    >
      <div className="relative">
        <div
          ref={track}
          onScroll={() => track.current && setIndex(slide_index(track.current))}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[max(0px,calc(var(--surface-radius)-var(--surface-padding-sm)))] bg-muted [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {media.map((variants, i) => (
            <button
              key={i}
              type="button"
              tabIndex={i === index ? 0 : -1}
              onClick={() => setViewer(true)}
              aria-label={t("product.gallery_open", { number: i + 1 })}
              className="relative aspect-product w-full shrink-0 cursor-zoom-in snap-center snap-always overflow-hidden"
            >
              <MediaImage
                src={variants[0].uri}
                alt={t("product.image", { name, number: i + 1 })}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                className="object-cover"
              />
            </button>
          ))}
        </div>
        {count > 1 && (
          <>
            <span
              data-gallery-counter
              className="pointer-events-none absolute bottom-2 right-3 rounded bg-background/70 px-1.5 py-0.5 text-xs tabular-nums text-heading md:hidden"
            >
              {t("product.gallery_counter", { current: index + 1, total: count })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("product.previous_slide")}
              disabled={index === 0}
              onClick={() => go(index - 1)}
              className="absolute left-2 top-1/2 hidden size-8 -translate-y-1/2 rounded-chip md:inline-flex"
            >
              <ArrowLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("product.next_slide")}
              disabled={index === count - 1}
              onClick={() => go(index + 1)}
              className="absolute right-2 top-1/2 hidden size-8 -translate-y-1/2 rounded-chip md:inline-flex"
            >
              <ArrowRight />
            </Button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 hidden grid-cols-5 gap-3 md:grid">
          {media.map((variants, i) => (
            <button
              key={i}
              type="button"
              data-gallery-thumb
              aria-label={t("product.show_image", { number: i + 1 })}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
              className={cn(
                "relative aspect-product overflow-hidden rounded-2xl bg-muted ring-1",
                i === index ? "ring-2 ring-primary" : "ring-border hover:ring-primary",
              )}
            >
              {/* One of five columns in the half-width gallery: about a tenth of the viewport, at most 128px. */}
              <MediaImage src={variants[0].uri} alt="" fill sizes="(min-width: 1280px) 128px, 10vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {viewer && (
        <GalleryViewer
          media={media}
          name={name}
          start={index}
          onClose={(last) => {
            setViewer(false);
            requestAnimationFrame(() => go(last, "auto"));
          }}
        />
      )}
    </div>
  );
}
