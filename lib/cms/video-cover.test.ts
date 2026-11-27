// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/video-cover/[file]/route";
import { cover_id, video_thumbnail } from "./video-cover";

const ID = "dQw4w9WgXcQ";
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

const jpeg = () => new Response(JPEG, { headers: { "content-type": "image/jpeg" } });
const call = (file: string) => GET(new Request(`http://shop.test/video-cover/${file}`), { params: Promise.resolve({ file }) } as never);

afterEach(() => vi.unstubAllGlobals());

describe("cover_id", () => {
  it("takes only <11-character ID>.jpg", () => {
    expect(cover_id(`${ID}.jpg`)).toBe(ID);
    for (const file of [ID, `${ID}.png`, `${ID}x.jpg`, "short.jpg", `../${ID}.jpg`, `${ID}.jpg/..`, "a%2Fb%2Fc%2Fd%2F.jpg", ""]) {
      expect(cover_id(file)).toBeNull();
    }
  });
});

describe("video_thumbnail", () => {
  it("asks the fixed host for the widest picture first, without cookies", async () => {
    const fetcher = vi.fn().mockResolvedValue(jpeg());
    vi.stubGlobal("fetch", fetcher);
    expect(await video_thumbnail(ID)).toHaveProperty("byteLength", 4);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe(`https://i.ytimg.com/vi/${ID}/maxresdefault.jpg`);
    expect(init).toMatchObject({ credentials: "omit", redirect: "error" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("falls back to hqdefault when the widest is missing", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("", { status: 404 })).mockResolvedValueOnce(jpeg());
    vi.stubGlobal("fetch", fetcher);
    expect(await video_thumbnail(ID)).not.toBeNull();
    expect(fetcher.mock.calls[1][0]).toBe(`https://i.ytimg.com/vi/${ID}/hqdefault.jpg`);
  });

  it("gives null on errors, timeouts and answers that are not a JPEG", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    expect(await video_thumbnail(ID)).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>", { headers: { "content-type": "text/html" } })));
    expect(await video_thumbnail(ID)).toBeNull();
  });
});

describe("GET /video-cover/[file]", () => {
  it("serves the JPEG with long cache headers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jpeg()));
    const response = await call(`${ID}.jpg`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toContain("max-age=86400");
  });

  it("answers 404 without calling YouTube for an invalid ID", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect((await call("x.jpg")).status).toBe(404);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("answers a short-cached 404 when YouTube has no picture", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const response = await call(`${ID}.jpg`);
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
  });
});
