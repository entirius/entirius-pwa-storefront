// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const PLAYLIST_EMBED = "videoseries";
const ID_PATH_PREFIXES = new Set(["embed", "shorts", "live"]);

// The video ID of a YouTube link (watch, youtu.be, embed, shorts, live; the protocol may be missing), or null. Only an 11-character ID is returned.
export function youtube_id(link: string | null | undefined): string | null {
  if (!link) return null;
  let url: URL;
  try {
    const trimmed = link.trim();
    url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const id =
    url.hostname === "youtu.be"
      ? parts[0]
      : ID_PATH_PREFIXES.has(parts[0] ?? "")
        ? parts[1]
        : parts[0] === "watch"
          ? url.searchParams.get("v")
          : null;
  return id && id !== PLAYLIST_EMBED && YOUTUBE_ID.test(id) ? id : null;
}
