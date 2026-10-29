// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import { API_CMS_BLOG_POST_ROUTE } from "@/API/api.routes";
import type { create_api } from "@/API/api.context";
import type { BlogPostRaw } from "@/types/blog.types";

type Api = ReturnType<typeof create_api>;
type Answer = { data?: BlogPostRaw[] };

// Every language version of a post (one route per post, one draft per language, like CMS pages).
const _load_versions = cache(async (api: Api, slug: string) =>
  api.FETCH_METHOD<Answer>(API_CMS_BLOG_POST_ROUTE, { querys: { routes: slug, limit: 50, page: 1 } }),
);

// One language version: with the language asked for, the answer carries its neighbours (`prev` / `next`).
const _load_in_language = cache(async (api: Api, slug: string, language: string) =>
  api.FETCH_METHOD<Answer>(API_CMS_BLOG_POST_ROUTE, { querys: { routes: slug, language, limit: 1, page: 1 } }),
);

const rows = ([error, answer]: Awaited<ReturnType<typeof _load_versions>>) =>
  error || !Array.isArray(answer?.data) ? [] : answer.data;

// The post in the page language, else in another one (like CMS pages), with the languages it is written in.
// null: no such post in this shop's channel.
export const load_blog_post = cache(async (api: Api, slug: string, language: string) => {
  const [versions, own] = await Promise.all([
    _load_versions(api, slug).then(rows),
    _load_in_language(api, slug, language).then(rows),
  ]);
  const fallback = versions[0];
  if (!own[0] && !fallback) return null;
  const post = own[0] ?? (await _load_in_language(api, slug, fallback.language).then(rows))[0] ?? fallback;
  const languages = [...new Set(versions.flatMap((version) => (version.language ? [version.language.toLowerCase()] : [])))];
  return { post, languages };
});
