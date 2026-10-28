// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { blog_author_path, blog_list_path, blog_post_path, page_numbers, page_param } from "./blog-paths";

describe("blog paths", () => {
  it("keeps the first page and no category as the bare list", () => {
    expect(blog_list_path()).toBe("/blog");
    expect(blog_list_path({ page: 1 })).toBe("/blog");
    expect(blog_list_path({ category: "news", page: 2 })).toBe("/blog?category_url_key=news&page=2");
  });

  // A Polish slug (quoted test data): a route may hold non-ASCII letters.
  it("encodes a post and an author slug", () => {
    expect(blog_post_path("zażółć")).toBe("/blog/za%C5%BC%C3%B3%C5%82%C4%87");
    expect(blog_author_path("anna-kowalska")).toBe("/blog/authors/anna-kowalska");
  });
});

describe("page_numbers", () => {
  it("lists every page of a short list", () => {
    expect(page_numbers(1, 1)).toEqual([1]);
    expect(page_numbers(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("puts gaps around the current page, never a gap of one page", () => {
    expect(page_numbers(6, 12)).toEqual([1, null, 5, 6, 7, null, 12]);
    expect(page_numbers(1, 12)).toEqual([1, 2, null, 12]);
    expect(page_numbers(4, 12)).toEqual([1, 2, 3, 4, 5, null, 12]);
    expect(page_numbers(12, 12)).toEqual([1, null, 11, 12]);
  });
});

describe("page_param", () => {
  it("reads a whole page number, 0 for anything else", () => {
    expect(page_param(undefined)).toBe(1);
    expect(page_param(["3", "4"])).toBe(3);
    expect([page_param("0"), page_param("-1"), page_param("2.5"), page_param("abc")]).toEqual([0, 0, 0, 0]);
  });
});
