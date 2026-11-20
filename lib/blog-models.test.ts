// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { blog_card_model, blog_pagination, blog_post_model } from "./blog-models";
import type { BlogPost } from "@/utils/NORMALIZERS/blog-post.normalizer";

describe("blog models", () => {
  it("gives a tile its address, the authors as one phrase and the date in the page language", () => {
    const card = blog_card_model(
      {
        slug: "getting-started",
        language: "en",
        title: "Getting started",
        excerpt: "",
        cover: null,
        authors: ["Anna", "Jan"],
        published_at: "2026-11-02T10:00:00Z",
      },
      "en",
    );
    expect(card).toEqual({
      href: "/blog/getting-started",
      language: "en",
      title: "Getting started",
      excerpt: "",
      cover: null,
      authors: "Anna and Jan",
      published: { iso: "2026-11-02T10:00:00Z", label: "2 November 2026" },
    });
  });

  it("links the names of the byline that have a page and keeps the words between them", () => {
    const author = (name: string, slug: string) => ({ name, slug, role: "", bio: "", photo: null });
    const post = {
      language: "en",
      title: "Post",
      cover: null,
      category: null,
      authors: [author("Anna", "anna"), author("Guest", "")],
      published_at: "2026-11-02T10:00:00Z",
      updated_at: "2026-11-02T12:00:00Z",
      prev: { title: "Older", slug: "older" },
      next: null,
      toc: [],
    } as unknown as BlogPost;
    const model = blog_post_model(post, "en");
    expect(model.byline).toEqual([
      { text: "Anna", href: "/blog/authors/anna" },
      { text: " and ", href: null },
      { text: "Guest", href: null },
    ]);
    // Edited on the day it was written: no "updated" date.
    expect(model.updated).toBeNull();
    expect(model.prev).toEqual({ title: "Older", href: "/blog/older" });
  });

  it("numbers the pages with gaps, and has none for a single page", () => {
    const href = (n: number) => `/pl/blog?page=${n}`;
    expect(blog_pagination(1, 1, href)).toBeNull();
    const pagination = blog_pagination(5, 9, href);
    expect(pagination?.prev).toBe("/pl/blog?page=4");
    expect(pagination?.next).toBe("/pl/blog?page=6");
    expect(pagination?.pages.map((page) => page?.number ?? null)).toEqual([1, null, 4, 5, 6, null, 9]);
    expect(pagination?.pages.find((page) => page?.current)?.number).toBe(5);
  });
});
