// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";

// Height of the sticky site header (h-16 plus its border).
const HEADER_HEIGHT = 65;

// Phone-only bar fixed to the bottom edge. It slides in once `target` (the primary action) is out of view and
// stays away while the cookie banner is open (the library marks <html class="show--consent">).
export function StickyBuyBar({ target, children }: { target: RefObject<HTMLElement | null>; children: ReactNode }) {
  const [away, setAway] = useState(false);
  const [consent_open, setConsentOpen] = useState(false);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    // The sticky header covers the top of the viewport: a target behind it counts as out of view.
    const observer = new IntersectionObserver(([entry]) => setAway(!entry.isIntersecting), {
      rootMargin: `-${HEADER_HEIGHT}px 0px 0px 0px`,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setConsentOpen(root.classList.contains("show--consent"));
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const shown = away && !consent_open;
  return (
    <div
        data-buy-bar
        data-shown={shown ? "" : undefined}
        inert={!shown}
        className={cn(
          "fixed inset-x-0 bottom-0 z-sticky flex items-center gap-3 border-t border-border bg-background px-4 pt-2 md:hidden",
          "pb-[max(0.5rem,env(safe-area-inset-bottom))] motion-safe:transition-transform motion-safe:duration-200",
          shown ? "translate-y-0" : "translate-y-full",
        )}
      >
        {children}
    </div>
  );
}
