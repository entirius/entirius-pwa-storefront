// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { resolve_media_url } from "@/utils/media-url";
import { apply_transform, plain_text, truncate_text } from "./transforms";

describe("plain_text", () => {
  it("drops tags and script/style bodies, decodes entities once, collapses whitespace", () => {
    expect(plain_text("<p>Soft&nbsp;seat</p><p>Steel &amp; oak</p>")).toBe("Soft seat Steel & oak");
    expect(plain_text("A<script>alert(1)</script>B<style>p{}</style>")).toBe("A B");
    expect(plain_text("&amp;lt;b&amp;gt; it&#39;s &#x2122; &bogus;")).toBe("&lt;b&gt; it's ™ &bogus;");
  });
});

describe("truncate_text", () => {
  it("leaves short text alone and cuts long text on a word with an ellipsis", () => {
    expect(truncate_text("Short text.", 160)).toBe("Short text.");
    expect(truncate_text("An executive office chair, fit for long shifts", 30)).toBe("An executive office chair…");
    expect(truncate_text("An executive office chair, fit for long shifts", 30).length).toBeLessThanOrEqual(30);
  });

  it("cuts inside a word when no space is near the limit", () => {
    expect(truncate_text("Supercalifragilistic", 10)).toBe("Supercali…");
  });
});

describe("apply_transform", () => {
  it("returns the value as read without a transform", () => {
    expect(apply_transform("x", undefined)).toBe("x");
  });

  it("runs a list left to right, the argument after the colon", () => {
    expect(apply_transform("<p>one two three four</p>", ["strip_html", "truncate:15"])).toBe("one two three…");
  });

  it("drops a value it cannot use", () => {
    expect(apply_transform(undefined, "strip_html")).toBeUndefined();
    expect(apply_transform(42, "upper")).toBeUndefined();
    expect(apply_transform("in stock", "availability")).toBeUndefined();
  });

  it("drops the field on an unknown transform name", () => {
    expect(apply_transform("x", "shout")).toBeUndefined();
  });

  it("maps on_stock to schema.org availability and upper-cases", () => {
    expect(apply_transform(true, "availability")).toBe("https://schema.org/InStock");
    expect(apply_transform(false, "availability")).toBe("https://schema.org/OutOfStock");
    expect(apply_transform("eur", "upper")).toBe("EUR");
  });

  it("turns media into the widest picture of each, by position, without videos", () => {
    const media = [
      { type: "image", position: 2, source_set: [{ width: 512, source: "/media/b.png" }] },
      { type: "video", position: 0, source_set: [{ width: 1920, source: "/media/v.mp4" }] },
      {
        type: "image",
        position: 1,
        source_set: [
          { width: 256, source: "/media/a-256.png" },
          { width: 1024, source: "/media/a-1024.png" },
          { width: 2048, source: "" },
        ],
      },
    ];
    expect(apply_transform(media, "media_urls")).toEqual([
      resolve_media_url("/media/a-1024.png"),
      resolve_media_url("/media/b.png"),
    ]);
    expect(media.map((m) => m.position)).toEqual([2, 0, 1]);
  });

  it("take keeps the first items of a list", () => {
    expect(apply_transform(["a", "b", "c"], "take:2")).toEqual(["a", "b"]);
    expect(apply_transform(["a", "b"], "take")).toEqual(["a"]);
    expect(apply_transform("a", "take")).toBeUndefined();
  });

  it("takes a single media object and absolutizes a path", () => {
    expect(apply_transform({ source_set: [{ width: 1, source: "/media/m.png" }] }, "media_urls")).toEqual([
      resolve_media_url("/media/m.png"),
    ]);
    expect(apply_transform("https://cdn.example.com/c.jpg", "absolute_url")).toBe("https://cdn.example.com/c.jpg");
    expect(apply_transform("/media/c.jpg", "absolute_url")).toMatch(/^https?:\/\/.+\/media\/c\.jpg$/);
  });
});
