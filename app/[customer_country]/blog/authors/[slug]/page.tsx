// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Globe } from "lucide-react";
import { decode_param } from "@/lib/route-params";
import { get_server_api } from "@/lib/seo/server-api";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { PROFILE_VIEWS, page_alternates } from "@/lib/seo/alternates";
import { build_blog_author_jsonld, build_blog_author_metadata } from "@/lib/seo/build";
import { JsonLd } from "@/lib/seo/json-ld";
import { profile_path } from "@/lib/profile-path";
import { BLOG_PATH, blog_author_path, page_param } from "@/lib/blog-paths";
import { PageBreadcrumbs } from "@/app/_components/layout/page-breadcrumbs";
import { NORM_BLOG_AUTHOR } from "@/utils/NORMALIZERS/blog-post.normalizer";
import { languages_with_posts, load_blog_posts } from "../../api.query";
import { AuthorPhoto } from "../../_components/author-photo";
import { PostGrid } from "../../_components/post-grid";
import { BlogPagination } from "../../_components/blog-pagination";
import { load_blog_author } from "./api.query";

// An author of the blog: photo, role, bio and links, then their posts in the page language, numbered pages (`?page=`).

interface Props {
  params: Promise<{ customer_country: string; slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

async function load({ params, searchParams }: Props) {
  const [{ customer_country, ...route }, query] = await Promise.all([params, searchParams]);
  const slug = decode_param(route.slug);
  const api = await get_server_api();
  const { language } = await get_i18n();
  const page = page_param(query.page);
  const [raw, posts] = await Promise.all([
    load_blog_author(api, slug),
    page ? load_blog_posts(api, { language, page, author: slug }) : null,
  ]);
  return { customer_country, api, slug, page, posts, author: raw ? NORM_BLOG_AUTHOR(raw, language) : null };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { customer_country, api, slug, page, author } = await load(props);
  if (!author) return {};
  const metadata = build_blog_author_metadata(author, {
    country: customer_country,
    languages:
      page === 1
        ? page_alternates(
            blog_author_path(slug),
            await languages_with_posts(api, PROFILE_VIEWS.map((view) => view.language), slug),
          )
        : undefined,
  });
  // A later page names itself.
  return page > 1
    ? { ...metadata, alternates: { canonical: profile_path(customer_country, `${blog_author_path(slug)}?page=${page}`) } }
    : metadata;
}

export default async function BlogAuthorPage(props: Props) {
  const { customer_country, slug, page, posts, author } = await load(props);
  if (!author || !page || (page > 1 && !posts?.cards.length)) notFound();

  const { t } = await get_i18n();
  const crumbs = [{ name: t("blog.title"), path: BLOG_PATH }];

  return (
    <>
      <JsonLd data={build_blog_author_jsonld(author, { country: customer_country }, crumbs)} />
      <PageBreadcrumbs trail={[...crumbs.map(({ name, path }) => ({ name, href: path })), { name: author.name }]} />
      <header className="surface flex flex-col gap-6 sm:flex-row sm:items-center">
        <AuthorPhoto author={author} size="lg" />
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl leading-tight md:text-5xl">{author.name}</h1>
          {author.role && <p className="text-muted-foreground">{author.role}</p>}
          {author.bio && <p className="max-w-prose">{author.bio}</p>}
          {author.links.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {author.links.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener me" className="link inline-flex items-center gap-1.5">
                    <Globe aria-hidden className="size-4" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>
      <section className="flex flex-col gap-6 py-8">
        <h2 className="text-2xl md:text-3xl">{t("blog.author_posts", { name: author.name })}</h2>
        <PostGrid cards={posts?.cards ?? []} heading="h3" />
        <BlogPagination
          page={page}
          pages={posts?.pages ?? 1}
          href={(n) => profile_path(customer_country, n > 1 ? `${blog_author_path(slug)}?page=${n}` : blog_author_path(slug))}
        />
      </section>
    </>
  );
}
