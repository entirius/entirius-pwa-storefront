// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { youtube_id } from "./video";

const ID = "dQw4w9WgXcQ";

describe("youtube_id", () => {
  it("reads watch, youtu.be, embed and shorts links", () => {
    expect(youtube_id(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
    expect(youtube_id(`https://youtu.be/${ID}`)).toBe(ID);
    expect(youtube_id(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
    expect(youtube_id(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
  });

  it("ignores extra parameters", () => {
    expect(youtube_id(`https://www.youtube.com/watch?v=${ID}&t=5`)).toBe(ID);
    expect(youtube_id(`https://youtu.be/${ID}?si=abc123`)).toBe(ID);
    expect(youtube_id(`https://www.youtube.com/watch?feature=share&v=${ID}`)).toBe(ID);
  });

  it("reads the mobile host and a link with surrounding spaces", () => {
    expect(youtube_id(`https://m.youtube.com/watch?v=${ID}`)).toBe(ID);
    expect(youtube_id(`  https://youtu.be/${ID}  `)).toBe(ID);
  });

  it("reads links without a protocol, live links and an uppercase host", () => {
    expect(youtube_id(`youtu.be/${ID}`)).toBe(ID);
    expect(youtube_id(`www.youtube.com/watch?v=${ID}`)).toBe(ID);
    expect(youtube_id(`youtube.com/watch?v=${ID}`)).toBe(ID);
    expect(youtube_id(`https://www.youtube.com/live/${ID}`)).toBe(ID);
    expect(youtube_id(`HTTPS://WWW.YOUTUBE.COM/watch?v=${ID}`)).toBe(ID);
  });

  it("returns null for playlists", () => {
    expect(youtube_id("https://www.youtube.com/embed/videoseries?list=PLabc123")).toBeNull();
    expect(youtube_id("https://www.youtube.com/playlist?list=PLabc123")).toBeNull();
  });

  it("returns null for anything else", () => {
    expect(youtube_id(null)).toBeNull();
    expect(youtube_id(undefined)).toBeNull();
    expect(youtube_id("")).toBeNull();
    expect(youtube_id("not a link")).toBeNull();
    expect(youtube_id("https://vimeo.com/123456789")).toBeNull();
    expect(youtube_id("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(youtube_id("https://www.youtube.com/watch")).toBeNull();
    expect(youtube_id("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(youtube_id(`https://www.youtube.com/watch?v=${ID}x`)).toBeNull();
    expect(youtube_id('https://youtu.be/dQw4w9WgXc"')).toBeNull();
  });
});
