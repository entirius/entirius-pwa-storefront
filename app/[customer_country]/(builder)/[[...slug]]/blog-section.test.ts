// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it, vi } from "vitest";
import type { create_api } from "@/API/api.context";
import { blog_section_routes, cms_blog_posts_query } from "./api.query";

type Api = ReturnType<typeof create_api>;

describe("blog_section_routes", () => {
  it("reads the routes the editor picked, once each, an address by its last segment", () => {
    expect(
      blog_section_routes([{ label: " ai-in-e-commerce " }, { label: "/blog/getting-started/" }, { label: "" }, {}, { label: "ai-in-e-commerce" }]),
    ).toEqual(["ai-in-e-commerce", "getting-started"]);
    expect(blog_section_routes(undefined)).toEqual([]);
  });
});

describe("cms_blog_posts_query", () => {
  const post = (route: string, language: string, title: string) => ({
    uid: `${route}-${language}`,
    language,
    routes: [route],
    extension: { title },
    content: { sections: {}, tiles: {}, sections_order: [], tiles_order: {} },
  });

  it("keeps the editor's order, prefers the page language and leaves out a missing post", async () => {
    // "Pierwszy": the Polish version's title (quoted test data), the one a `pl` page picks.
    const answers: Record<string, unknown> = {
      first: [null, { data: [post("first", "EN", "First"), post("first", "PL", "Pierwszy")] }],
      gone: [{ status: 400, message: "invalid_choice" }, null],
      second: [null, { data: [post("second", "EN", "Second")] }],
    };
    const FETCH_METHOD = vi.fn(async (_route: string, init: { querys: { routes: string } }) => answers[init.querys.routes]);
    const query = cms_blog_posts_query({ FETCH_METHOD } as unknown as Api, ["first", "gone", "second"], "pl");
    expect(query.queryKey).toEqual(["cms-blog-posts", ["first", "gone", "second"], "pl"]);
    expect((await query.queryFn()).map((card) => card.title)).toEqual(["Pierwszy", "Second"]);
    expect(FETCH_METHOD).toHaveBeenCalledTimes(3);
  });
});
