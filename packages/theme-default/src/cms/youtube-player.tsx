// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import type { CmsPicture } from "@entirius/storefront-sdk/cms";
import { Media } from "@entirius/storefront-sdk/components/media";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

// Click-to-play: before the click nothing is requested from YouTube or Google; the youtube-nocookie iframe replaces
// the cover in the same 16:9 box. The cover is the editor's picture (the backend's media) or, without one, the
// video's thumbnail from the shop's own origin; when that is missing too, the dark box stays.

export function YoutubePlayer({ id, cover }: { id: string; cover?: CmsPicture | null }) {
  const { t } = useI18n();
  const [playing, setPlaying] = useState(false);
  const [thumbnail_failed, setThumbnailFailed] = useState(false);
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
          {cover ? (
            <Media src={cover.src} alt={cover.alt || t("cms.video_title")} fill sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" />
          ) : (
            !thumbnail_failed && (
              <Image
                // An error before hydration never reaches onError: look at the finished image once mounted.
                ref={(img) => {
                  if (img?.complete && img.naturalWidth === 0) setThumbnailFailed(true);
                }}
                src={`/video-cover/${id}.jpg`}
                alt={t("cms.video_title")}
                fill
                unoptimized
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover"
                onError={() => setThumbnailFailed(true)}
              />
            )
          )}
          <span className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
            <Play aria-hidden className="size-7 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}
