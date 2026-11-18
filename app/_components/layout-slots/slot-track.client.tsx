// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

const RAMP_MS = 600;

const ease_out = (t: number) => 1 - (1 - t) ** 2;
const ease_in = (t: number) => t ** 2;

// Wraps the looping track of a layout slot: while the pointer is over it or keyboard focus is inside it, the theme's CSS animation
// slows to a full stop; it eases back to full speed afterwards. Does nothing without a running animation.
export function SlotTrack({ style, children }: { style: CSSProperties; children: ReactNode }) {
  const track_ref = useRef<HTMLDivElement>(null);
  const frame_ref = useRef(0);
  const hovered_ref = useRef(false);
  const focused_ref = useRef(false);

  useEffect(() => () => cancelAnimationFrame(frame_ref.current), []);

  const ramp_to = (target: number) => {
    cancelAnimationFrame(frame_ref.current);
    const animation = track_ref.current?.getAnimations().find((item) => item instanceof CSSAnimation);
    if (!animation) return;

    const from = animation.playbackRate;
    const ease = target === 0 ? ease_out : ease_in;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / RAMP_MS, 1);
      animation.updatePlaybackRate(from + (target - from) * ease(progress));
      if (progress < 1) frame_ref.current = requestAnimationFrame(step);
    };
    frame_ref.current = requestAnimationFrame(step);
  };

  const sync = () => ramp_to(hovered_ref.current || focused_ref.current ? 0 : 1);

  return (
    <div
      ref={track_ref}
      data-slot-track
      style={style}
      onPointerEnter={() => {
        hovered_ref.current = true;
        sync();
      }}
      onPointerLeave={() => {
        hovered_ref.current = false;
        sync();
      }}
      onFocus={(event) => {
        focused_ref.current = event.target.matches(":focus-visible");
        sync();
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        focused_ref.current = false;
        sync();
      }}
    >
      {children}
    </div>
  );
}
