// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

// Click-to-play: before the click nothing is requested from YouTube; the youtube-nocookie iframe replaces the
// placeholder in the same 16:9 box.

export function YoutubePlayer({ id }: { id: string }) {
  const { t } = useI18n();
  const [playing, setPlaying] = useState(false);
  const iframe_ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (playing) iframe_ref.current?.focus();
  }, [playing]);

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-foreground">
      {playing ? (
        <iframe
          ref={iframe_ref}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1`}
          title={t("cms.video_title")}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={t("cms.video_play")}
          className="group absolute inset-0 size-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-background"
        >
          <span className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
            <Play aria-hidden className="size-7 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}
