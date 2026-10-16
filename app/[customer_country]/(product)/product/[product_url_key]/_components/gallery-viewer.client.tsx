// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import { MediaImage } from "@/components/ui/media-image.client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n.provider";
import { scroll_behavior, slide_index, type GalleryMedia } from "./gallery-utils";

const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 300;
const EDGE_BUTTON =
  "absolute top-1/2 z-[1] hidden h-16 w-12 -translate-y-1/2 items-center justify-center text-heading " +
  "outline-none focus-visible:ring-1 focus-visible:ring-ring md:flex";

// One picture that zooms by double tap / double click (2.5x) and by pinch (up to 4x). The zoomed picture is a
// larger box inside a scrollable frame, so panning is the browser's own scrolling.
function ZoomSlide({ src, alt, active, eager }: { src: string; alt: string; active: boolean; eager: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const pinch = useRef<{ distance: number; scale: number } | null>(null);
  const last_toggle = useRef(0);
  const touch_start = useRef({ x: 0, y: 0 });

  // Leaving the slide resets the zoom (state adjusted during render, not in an effect).
  const [was_active, setWasActive] = useState(active);
  if (active !== was_active) {
    setWasActive(active);
    if (!active) setScale(1);
  }

  const zoom_to = (next: number, x = 0.5, y = 0.5) => {
    const el = frame.current;
    if (!el) return;
    const fx = (el.scrollLeft + x * el.clientWidth) / el.scrollWidth;
    const fy = (el.scrollTop + y * el.clientHeight) / el.scrollHeight;
    flushSync(() => setScale(next));
    el.scrollLeft = fx * el.scrollWidth - x * el.clientWidth;
    el.scrollTop = fy * el.scrollHeight - y * el.clientHeight;
  };

  const toggle = (clientX: number, clientY: number) => {
    const el = frame.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    last_toggle.current = Date.now();
    zoom_to(scale > 1 ? 1 : 2.5, (clientX - box.left) / box.width, (clientY - box.top) / box.height);
  };

  const distance = (e: React.TouchEvent) =>
    Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);

  return (
    <div
      ref={frame}
      className="h-dvh w-screen shrink-0 snap-center snap-always overflow-auto [scrollbar-width:none] [touch-action:pan-x_pan-y] [&::-webkit-scrollbar]:hidden"
      onDoubleClick={(e) => Date.now() - last_toggle.current > 500 && toggle(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        if (e.touches.length === 2) pinch.current = { distance: distance(e), scale };
        touch_start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchMove={(e) => {
        if (e.touches.length !== 2 || !pinch.current) return;
        const next = pinch.current.scale * (distance(e) / pinch.current.distance);
        zoom_to(Math.min(MAX_SCALE, Math.max(1, next)));
      }}
      onTouchEnd={(e) => {
        if (e.touches.length < 2) pinch.current = null;
        const touch = e.changedTouches[0];
        if (e.touches.length || e.changedTouches.length !== 1) return;
        if (Math.hypot(touch.clientX - touch_start.current.x, touch.clientY - touch_start.current.y) > 10) return;
        if (Date.now() - last_toggle.current < DOUBLE_TAP_MS) return toggle(touch.clientX, touch.clientY);
        last_toggle.current = Date.now() - 1;
      }}
    >
      <div className="relative" style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }}>
        <MediaImage
          src={src}
          alt={alt}
          fill
          sizes="150vw"
          loading={eager ? "eager" : "lazy"}
          draggable={false}
          className="select-none object-contain"
        />
      </div>
    </div>
  );
}

// Full-screen viewer: swipe (scroll-snap), keyboard arrows, Escape, 44 px close target, Tab kept inside, focus
// returns to the opener.
export function GalleryViewer({
  media,
  name,
  start,
  onClose,
}: {
  media: GalleryMedia;
  name: string;
  start: number;
  onClose: (index: number) => void;
}) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const close_button = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(start);
  // The slide the viewer opened on. `start` follows the gallery behind, which must not re-run the opening.
  const [first] = useState(start);
  const count = media.length;

  const go = (to: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: Math.max(0, Math.min(count - 1, to)) * el.clientWidth, behavior: scroll_behavior() });
  };

  useLayoutEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (track.current) track.current.scrollLeft = first * track.current.clientWidth;
    close_button.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, [first]);

  // The edge buttons go away on the first and the last slide; if one had focus, the dialog takes it back, or
  // the keys would stop reaching it.
  useEffect(() => {
    if (!dialog.current?.contains(document.activeElement)) dialog.current?.focus({ preventScroll: true });
  }, [index]);

  const on_key = (e: React.KeyboardEvent) => {
    // The viewer is a portal of the gallery: its keys would also move the gallery behind it.
    e.stopPropagation();
    if (e.key === "Escape") onClose(index);
    if (e.key === "ArrowLeft") go(index - 1);
    if (e.key === "ArrowRight") go(index + 1);
    if (e.key === "Tab") {
      // Tab and Shift+Tab cycle through the viewer's own buttons.
      e.preventDefault();
      const buttons = [...(dialog.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])].filter(
        (b) => b.offsetParent !== null,
      );
      const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = at === -1 ? 0 : (at + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
  };

  return createPortal(
    <div
      ref={dialog}
      data-gallery-viewer
      role="dialog"
      tabIndex={-1}
      aria-modal="true"
      aria-label={t("product.gallery_viewer", { name })}
      onKeyDown={on_key}
      className="fixed inset-0 z-[60] bg-background outline-none"
    >
      <div
        ref={track}
        onScroll={() => track.current && setIndex(slide_index(track.current))}
        className="flex h-dvh snap-x snap-mandatory overflow-x-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {media.map((variants, i) => (
          <ZoomSlide
            key={i}
            src={variants[0].uri}
            alt={t("product.image", { name, number: i + 1 })}
            active={i === index}
            eager={Math.abs(i - first) <= 1}
          />
        ))}
      </div>
      <button
        ref={close_button}
        type="button"
        aria-label={t("common.close")}
        onClick={() => onClose(index)}
        className="absolute right-[max(0.5rem,env(safe-area-inset-right))] top-[max(0.5rem,env(safe-area-inset-top))] grid size-touch place-items-center rounded-full bg-background/70 text-heading outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-6" strokeWidth={1.5} />
      </button>
      {count > 1 && (
        <>
          <span className="pointer-events-none absolute left-[max(1rem,env(safe-area-inset-left))] top-[max(1.1rem,env(safe-area-inset-top))] text-sm tabular-nums text-heading">
            {t("product.gallery_counter", { current: index + 1, total: count })}
          </span>
          {index > 0 && (
            <button type="button" aria-label={t("product.previous_slide")} onClick={() => go(index - 1)} className={cn(EDGE_BUTTON, "left-2")}>
              <ChevronLeft className="size-9" strokeWidth={1} />
            </button>
          )}
          {index < count - 1 && (
            <button type="button" aria-label={t("product.next_slide")} onClick={() => go(index + 1)} className={cn(EDGE_BUTTON, "right-2")}>
              <ChevronRight className="size-9" strokeWidth={1} />
            </button>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}
