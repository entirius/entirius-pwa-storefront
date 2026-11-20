// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { BlogListPageProps } from "@entirius/storefront-sdk/blog";
import { CategoryTabs } from "@theme/blog/category-tabs";
import { PostGrid } from "@theme/blog/post-grid";
import { BlogPagination } from "@theme/blog/pagination";

// The blog: the intro (the CMS page under the route `blog`, else a plain heading), the category tabs, a page of
// posts and the page numbers.
export function BlogPage({ t, intro, tabs, posts, pagination }: BlogListPageProps) {
  return (
    <>
      {intro ? (
        <>
          <h1 className="sr-only">{t("blog.title")}</h1>
          {intro}
        </>
      ) : (
        <header className="surface bg-gradient-backdrop">
          <h1 className="text-4xl leading-tight md:text-5xl">{t("blog.title")}</h1>
        </header>
      )}
      <div className="flex flex-col gap-6 py-8">
        <CategoryTabs t={t} tabs={tabs} />
        <PostGrid t={t} posts={posts} />
        <BlogPagination pagination={pagination} />
      </div>
    </>
  );
}
