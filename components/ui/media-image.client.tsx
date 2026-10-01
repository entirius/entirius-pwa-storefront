"use client";

import { useState, type ComponentProps } from "react";
import Image from "next/image";

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
export function MediaImage({ src, alt, onError, ...props }: MediaImageProps) {
  const resolved = src ? safe_src(src) : image_placeholder;
  const [failed, setFailed] = useState<string | null>(null);

  return (
    <Image
      {...props}
      src={failed === resolved ? image_placeholder : resolved}
      alt={alt}
      onError={(event) => {
        setFailed(resolved);
        onError?.(event);
      }}
    />
  );
}
