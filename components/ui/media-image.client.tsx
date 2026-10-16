// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState, type ComponentProps } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

import { API_BASE_URL } from "@/_CONFIG/app.config.json";
import {
  image_placeholder,
  resolve_media_uri,
} from "@/utils/NORMALIZERS/media.normalizer";

const MEDIA_ORIGIN = new URL(API_BASE_URL).origin;

// Cart and wishlist persist media URIs in localStorage, so a src can predate
// the current config: a relative backend path, or a host that is no longer in
// images.remotePatterns (next/image throws on those). Map anything we cannot
// serve to the placeholder.
function safe_src(src: string): string {
  if (src.startsWith("/media/")) return resolve_media_uri(src);
  if (src.startsWith("/")) return src;
  try {
    return new URL(src).origin === MEDIA_ORIGIN ? src : image_placeholder;
  } catch {
    return image_placeholder;
  }
}

type MediaImageProps = Omit<ComponentProps<typeof Image>, "src"> & {
  src: string | null | undefined;
};

// next/image for backend media: falls back to the placeholder when the file
// is missing or fails to load.
export function MediaImage({ src, alt, onError, className, ...props }: MediaImageProps) {
  const resolved = src ? safe_src(src) : image_placeholder;
  const [failed, setFailed] = useState<string | null>(null);
  const shown = failed === resolved ? image_placeholder : resolved;

  return (
    <Image
      {...props}
      src={shown}
      // The placeholder is a small centred icon: never cropped or blown up by the picture's object-cover.
      className={cn(className, shown === image_placeholder && "object-contain")}
      alt={alt}
      onError={(event) => {
        setFailed(resolved);
        onError?.(event);
      }}
    />
  );
}
