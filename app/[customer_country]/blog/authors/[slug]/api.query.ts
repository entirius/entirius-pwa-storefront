// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import { API_CMS_BLOG_AUTHORS_ROUTE } from "@/API/api.routes";
import type { create_api } from "@/API/api.context";
import type { BlogAuthorRaw } from "@/types/blog.types";

type Api = ReturnType<typeof create_api>;

// An active author with published posts in this channel; null for any other slug (contentdb answers 404).
export const load_blog_author = cache(async (api: Api, slug: string): Promise<BlogAuthorRaw | null> => {
  const [error, answer] = await api.FETCH_METHOD<{ data?: BlogAuthorRaw }>(API_CMS_BLOG_AUTHORS_ROUTE, { suffix: [slug] });
  return error || !answer?.data?.slug ? null : answer.data;
});
