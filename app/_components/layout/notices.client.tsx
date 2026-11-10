// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, CircleAlert, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LinkDynamic } from "@/lib/link-dynamic";
import { useNotices, type Notice, type NoticeTone } from "@/stores/notices.store";
import { useI18n } from "@/providers/i18n.provider";

const TONES: Record<NoticeTone, { icon: LucideIcon; badge: string }> = {
  positive: { icon: Check, badge: "bg-positive-surface text-positive" },
  destructive: { icon: CircleAlert, badge: "bg-destructive-surface text-destructive" },
  notice: { icon: TriangleAlert, badge: "bg-notice-surface text-notice" },
  informative: { icon: Info, badge: "bg-informative-surface text-informative" },
};

// The short messages of stores/notices.store.ts, under the header. Errors go into an alert region and the rest into
// a polite status region: both are on the page before any notice, so a screen reader announces what lands in them.
// Errors sit on top. A notice is about the page it came on: moving to another page closes them all.
export function Notices() {
  const notices = useNotices((s) => s.notices);
  const clear = useNotices((s) => s.clear);
  const pathname = usePathname();
  const shown_on = useRef(pathname);
  useEffect(() => {
    if (pathname === shown_on.current) return;
    shown_on.current = pathname;
    clear();
  }, [pathname, clear]);

  return (
    <>
      <div role="alert" aria-atomic="false">
        {notices
          .filter((n) => n.tone === "destructive")
          .map((n) => (
            <NoticeCard key={n.id} notice={n} />
          ))}
      </div>
      <div role="status" aria-live="polite" aria-atomic="false">
        {notices
          .filter((n) => n.tone !== "destructive")
          .map((n) => (
            <NoticeCard key={n.id} notice={n} />
          ))}
      </div>
    </>
  );
}

// Goes after its timeout, but never while the pointer or keyboard focus is on it (WCAG 2.2.1): leaving restarts the
// full delay.
function NoticeCard({ notice }: { notice: Notice }) {
  const { t } = useI18n();
  const dismiss = useNotices((s) => s.dismiss);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (held) return;
    const timer = setTimeout(() => dismiss(notice.id), notice.timeout);
    return () => clearTimeout(timer);
  }, [held, notice.id, notice.timeout, dismiss]);

  const { icon: Icon, badge } = TONES[notice.tone];
  const action = notice.action;
  return (
    <div
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false);
      }}
      className="pointer-events-auto mb-3 flex items-start gap-3 rounded-3xl border border-border bg-card p-4 shadow-glow motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2"
    >
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", badge)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="flex min-h-9 min-w-0 flex-1 flex-col justify-center gap-1">
        {notice.title && <p className="font-semibold text-heading">{t(notice.title)}</p>}
        <p className={notice.title ? "text-sm text-muted-foreground" : "font-semibold text-heading"}>
          {t(notice.message, notice.params)}
        </p>
        {action &&
          ("href" in action ? (
            <Button variant="link" className="h-auto self-start p-0" asChild>
              <LinkDynamic href={action.href} onClick={() => dismiss(notice.id)}>
                {t(action.label)}
              </LinkDynamic>
            </Button>
          ) : (
            <Button
              variant="link"
              className="h-auto self-start p-0"
              onClick={() => {
                dismiss(notice.id);
                action.run();
              }}
            >
              {t(action.label)}
            </Button>
          ))}
      </div>
      <Button variant="ghost" size="icon" aria-label={t("common.close")} onClick={() => dismiss(notice.id)}>
        <X />
      </Button>
    </div>
  );
}
