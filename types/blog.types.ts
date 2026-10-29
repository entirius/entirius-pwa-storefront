// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsImagesSet } from "@/app/[customer_country]/(builder)/[[...slug]]/_components/cms-image";
import type { CmsDocumentContent } from "./cms.types";

// A contentdb author as a post lists it. `*_t9n`: text per language ({ en: "...", pl: "..." }).
export interface BlogAuthorBrief {
  uid: string;
  name: string;
  slug: string;
  role_t9n?: Record<string, string>;
  description_t9n?: Record<string, string>;
  photo_url?: string | null;
}

// A public author (`authors/<slug>/`): the brief with contacts and social profiles ({ linkedin: url, other: { name: url } }).
export interface BlogAuthorRaw extends BlogAuthorBrief {
  contact_url?: string;
  social_profiles?: Record<string, string | Record<string, string>>;
  published_post_count?: number;
}

// The neighbour of a post in its language (older: `prev`, newer: `next`).
export interface BlogPostSibling {
  uid: string;
  name?: string;
  title?: string | null;
  routes: string[];
}

// A published `blog-post`, as `published/blog-post/` returns it.
export interface BlogPostRaw {
  uid: string;
  name?: string;
  language: string;
  routes: string[];
  // `og_image`: the cover an AI Studio article carries for sharing.
  meta?: { title?: string; description?: string; og_title?: string; og_description?: string; og_image?: string };
  // The post's tile: its title, summary (HTML) and cover; `author` is a free-text name from older posts.
  extension?: { title?: string; description?: string; images_set?: CmsImagesSet; author?: string } | null;
  category?: { uid: string; name: string; url_key: string; language?: string } | null;
  authors?: BlogAuthorBrief[];
  co_authors?: BlogAuthorBrief[];
  // `created_at`: when the post was written (the draft); `updated_at`: its last publication.
  created_at?: string;
  updated_at?: string;
  prev?: BlogPostSibling | null;
  next?: BlogPostSibling | null;
  content: CmsDocumentContent;
}

// A page of a contentdb list.
export interface ContentDbPage<T> {
  data?: T[];
  pagination?: { page: number; limit: number; pages: number; records: number };
}

// A blog category (`category/`), in one language.
export interface BlogCategoryRaw {
  uid: string;
  name: string;
  url_key: string;
  language?: string;
  published_posts_count?: number;
}
