// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n.provider";

// Text clamped to 2 lines (3 from md) with a "Show more" / "Show less" link. The full text is always in the DOM
// (SEO); clamping is CSS only. The link appears only when the text overflows, measured after mount and on resize.
// `likely_long` (decided on the server, e.g. from the text length) renders the link from the first paint, so a long
// text does not shift the page when the measurement lands.
export function ExpandableText({
  children,
  className,
  likely_long = false,
}: {
  children: React.ReactNode;
  className?: string;
  likely_long?: boolean;
}) {
  const { t } = useI18n();
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(likely_long);

  useEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    // The clamped box keeps its height when the text changes; its children show it.
    for (const node of [el, ...el.children]) observer.observe(node);
    return () => observer.disconnect();
  }, [open]);

  return (
    <div data-expandable className={className}>
      <div id={id} ref={ref} className={cn(!open && "line-clamp-2 md:line-clamp-3")}>
        {children}
      </div>
      {(overflows || open) && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="link relative touch-target mt-1 cursor-pointer text-sm"
        >
          {open ? t("common.show_less") : t("common.show_more")}
        </button>
      )}
    </div>
  );
}
