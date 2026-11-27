// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { is_youtube_id } from "@/lib/cms/video";

// The video section's cover when the editor uploaded none: YouTube's thumbnail, fetched by the server so the
// visitor's browser never talks to a Google host. The host is fixed and only a validated 11-character ID reaches
// the URL; nothing of the visitor's request (cookies, headers) is forwarded.
const THUMBNAIL_HOST = "https://i.ytimg.com/vi";
// The widest picture first (missing for many videos: 404), then the one every video has.
const THUMBNAIL_FILES = ["maxresdefault.jpg", "hqdefault.jpg"];
const TIMEOUT_MS = 4000;
const MAX_BYTES = 1_000_000;

// The route's file name (`<id>.jpg`) → the video ID, or null.
export function cover_id(file: string): string | null {
  if (!file.endsWith(".jpg")) return null;
  const id = file.slice(0, -".jpg".length);
  return is_youtube_id(id) ? id : null;
}

async function fetch_thumbnail(id: string, name: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(`${THUMBNAIL_HOST}/${id}/${name}`, {
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 86400 },
    });
    if (!response.ok || response.headers.get("content-type") !== "image/jpeg") return null;
    const body = await response.arrayBuffer();
    return body.byteLength > 0 && body.byteLength <= MAX_BYTES ? body : null;
  } catch {
    return null;
  }
}

// The JPEG of a video's thumbnail, or null when YouTube has none or does not answer in time.
export async function video_thumbnail(id: string): Promise<ArrayBuffer | null> {
  for (const name of THUMBNAIL_FILES) {
    const body = await fetch_thumbnail(id, name);
    if (body) return body;
  }
  return null;
}
