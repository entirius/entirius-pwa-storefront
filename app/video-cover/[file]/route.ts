// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cover_id, video_thumbnail } from "@/lib/cms/video-cover";

// The video section's cover from the shop's own origin: `/video-cover/<id>.jpg` is YouTube's thumbnail fetched
// server-side (lib/cms/video-cover.ts), so the visitor's browser makes no request to a Google host before the
// click. A file name that is not `<11-character ID>.jpg` never reaches the upstream URL.
export async function GET(_request: Request, ctx: RouteContext<"/video-cover/[file]">) {
  const { file } = await ctx.params;
  const id = cover_id(file);
  if (!id) return new Response("Not found", { status: 404 });

  const body = await video_thumbnail(id);
  // A miss is cached briefly: the placeholder shows, and the next visitor retries soon.
  if (!body) return new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=300" } });
  return new Response(body, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
