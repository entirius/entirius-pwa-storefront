// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { decode_param } from "@/lib/route-params";
import { get_server_api } from "@/lib/seo/server-api";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { page_alternates } from "@/lib/seo/alternates";
import { build_blog_post_jsonld, build_blog_post_metadata } from "@/lib/seo/build";
import { JsonLd } from "@/lib/seo/json-ld";
import { PageBreadcrumbs } from "@/app/_components/layout/page-breadcrumbs";
import CmsImage from "@/app/[customer_country]/(builder)/[[...slug]]/_components/cms-image";
import { render_cms_document } from "@/app/[customer_country]/(builder)/[[...slug]]/_components/cms-renderer";
import { cms_content_prefetches } from "@/app/[customer_country]/(builder)/[[...slug]]/api.query";
import { NORM_BLOG_POST, format_blog_date, updated_later } from "@/utils/NORMALIZERS/blog-post.normalizer";
import { LinkDynamic } from "@/lib/link-dynamic";
import { BLOG_PATH, blog_list_path, blog_post_path } from "@/lib/blog-paths";
import { load_blog_post } from "./api.query";
import { AuthorNames } from "./_components/author-names";
import { PostToc } from "./_components/post-toc";
import { PostAuthors } from "./_components/post-authors";
import { PostNeighbours } from "./_components/post-neighbours";

// A published contentdb `blog-post`: rendered on the server (text for crawlers, JSON-LD, the table of contents'
// anchors), its builder content by the CMS renderer with the same prefetches as a CMS page.

interface Props {
  params: Promise<{ customer_country: string; slug: string }>;
}

// The reading column (~900 px); the cover takes the page width.
const COLUMN = "mx-auto w-full max-w-4xl";

async function load(params: Props["params"]) {
  const { customer_country, ...route } = await params;
  const api = await get_server_api();
  const { language } = await get_i18n();
  const found = await load_blog_post(api, decode_param(route.slug), language);
  return { customer_country, api, language, found };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { customer_country, language, found } = await load(params);
  if (!found) return {};
  const post = NORM_BLOG_POST(found.post, language);
  return build_blog_post_metadata(post, {
    country: customer_country,
    languages: page_alternates(blog_post_path(post.slug), found.languages),
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { customer_country, api, language, found } = await load(params);
  if (!found) notFound();

  const { t } = await get_i18n();
  const post = NORM_BLOG_POST(found.post, language);
  const crumbs = [{ name: t("blog.title"), path: BLOG_PATH }];

  return (
    <>
      <JsonLd data={build_blog_post_jsonld(post, { country: customer_country }, crumbs)} />
      <PageBreadcrumbs trail={[...crumbs.map(({ name, path }) => ({ name, href: path })), { name: post.title }]} />
      <article data-article lang={post.language || undefined} className="flex w-full flex-col gap-8 pb-8">
        <header className={cn(COLUMN, "flex flex-col gap-4")}>
          {post.category && (
            <LinkDynamic
              href={blog_list_path({ category: post.category.url_key })}
              className="w-fit text-sm font-medium text-primary hover:underline"
            >
              {post.category.name}
            </LinkDynamic>
          )}
          <h1 className="text-4xl leading-tight md:text-5xl">{post.title}</h1>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <AuthorNames authors={post.authors} language={language} />
            {post.published_at && (
              <time dateTime={post.published_at}>
                {t("blog.published", { date: format_blog_date(post.published_at, language) })}
              </time>
            )}
            {post.updated_at && updated_later(post) && (
              <time dateTime={post.updated_at}>
                {t("blog.updated", { date: format_blog_date(post.updated_at, language) })}
              </time>
            )}
          </p>
        </header>
        {post.cover && <CmsImage images_set={post.cover} aspect_ratio={16 / 9} sizes="100vw" className="rounded-3xl" />}
        <div className={cn(COLUMN, "flex flex-col gap-8")}>
          <PostToc entries={post.toc} />
          <PrefetchBoundary prefetches={await cms_content_prefetches(api, post.content, language)}>
            <div className="flex flex-col">{render_cms_document(post.content)}</div>
          </PrefetchBoundary>
          <PostAuthors authors={post.authors} />
          <PostNeighbours prev={post.prev} next={post.next} />
        </div>
      </article>
    </>
  );
}
