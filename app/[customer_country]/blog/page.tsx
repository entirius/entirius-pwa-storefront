// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { get_server_api } from "@/lib/seo/server-api";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { PROFILE_VIEWS, page_alternates } from "@/lib/seo/alternates";
import { build_blog_list_jsonld } from "@/lib/seo/build";
import { JsonLd } from "@/lib/seo/json-ld";
import { profile_path } from "@/lib/profile-path";
import { BLOG_PATH, blog_list_path, page_param } from "@/lib/blog-paths";
import { PageBreadcrumbs } from "@/app/_components/layout/page-breadcrumbs";
import { render_cms_document } from "@/app/[customer_country]/(builder)/[[...slug]]/_components/cms-renderer";
import {
  cms_content_prefetches,
  load_static_page,
  pick_static_page,
} from "@/app/[customer_country]/(builder)/[[...slug]]/api.query";
import { languages_with_posts, load_blog_categories, load_blog_posts } from "./api.query";
import { CategoryTabs } from "./_components/category-tabs";
import { PostGrid } from "./_components/post-grid";
import { BlogPagination } from "./_components/blog-pagination";

// The blog: posts written in the page language, newest first, a tab per category (`?category_url_key=`) and
// numbered pages (`?page=`). The CMS page published under the route `blog` (what the catch-all served here before)
// is the list's intro: its sections above the tabs, its meta title and description for the page.

const BLOG_INTRO_ROUTE = "blog";

interface Props {
  params: Promise<{ customer_country: string }>;
  searchParams: Promise<{ category_url_key?: string | string[]; page?: string | string[] }>;
}

// A repeated parameter counts once.
const first = (value: string | string[] | undefined) => ((Array.isArray(value) ? value[0] : value) ?? "").trim();

async function load({ params, searchParams }: Props) {
  const [{ customer_country }, query] = await Promise.all([params, searchParams]);
  const api = await get_server_api();
  const { language } = await get_i18n();
  const category_key = first(query.category_url_key) || null;
  const page = page_param(query.page);
  const [categories, posts, [, intro_pages]] = await Promise.all([
    load_blog_categories(api, language),
    page ? load_blog_posts(api, { language, page, category: category_key ?? undefined }) : null,
    load_static_page(api, { routes: [BLOG_INTRO_ROUTE] }),
  ]);
  return {
    customer_country,
    api,
    language,
    category_key,
    category: categories.find((category) => category.url_key === category_key) ?? null,
    categories,
    page,
    posts,
    intro: pick_static_page(intro_pages?.data, language),
  };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { customer_country, api, category_key, category, page, posts, intro } = await load(props);
  const { t } = await get_i18n();
  const plain = !category_key && page === 1;
  return {
    title: category ? t("blog.category_title", { category: category.name }) : intro?.meta?.title || t("blog.title"),
    description: intro?.meta?.description,
    // A category or a later page names itself; the plain list also names its address in the other profiles.
    alternates: {
      canonical: profile_path(customer_country, blog_list_path({ category: category_key, page })),
      languages: plain
        ? page_alternates(BLOG_PATH, await languages_with_posts(api, PROFILE_VIEWS.map((view) => view.language)))
        : undefined,
    },
    // An empty list (no posts yet, an unknown category) has nothing to index.
    ...(!posts?.cards.length && { robots: { index: false } }),
  };
}

export default async function BlogPage(props: Props) {
  const { customer_country, api, language, category_key, category, categories, page, posts, intro } =
    await load(props);
  // Not a page number, or past the last page.
  if (!page || (page > 1 && !posts?.cards.length)) notFound();

  const { t } = await get_i18n();
  const cards = posts?.cards ?? [];
  const name = intro?.meta?.title || t("blog.title");

  return (
    <>
      <JsonLd data={build_blog_list_jsonld(cards, { country: customer_country }, { name, category: category_key, page })} />
      <PageBreadcrumbs trail={[{ name: t("blog.title") }]} />
      {intro ? (
        <>
          <h1 className="sr-only">{t("blog.title")}</h1>
          <PrefetchBoundary prefetches={await cms_content_prefetches(api, intro.content, language)}>
            {render_cms_document(intro.content)}
          </PrefetchBoundary>
        </>
      ) : (
        <header className="surface bg-gradient-backdrop">
          <h1 className="text-4xl leading-tight md:text-5xl">{t("blog.title")}</h1>
        </header>
      )}
      <div className="flex flex-col gap-6 py-8">
        <CategoryTabs categories={categories} active={category?.url_key ?? null} />
        <PostGrid cards={cards} />
        <BlogPagination
          page={page}
          pages={posts?.pages ?? 1}
          href={(n) => profile_path(customer_country, blog_list_path({ category: category_key, page: n }))}
        />
      </div>
    </>
  );
}
