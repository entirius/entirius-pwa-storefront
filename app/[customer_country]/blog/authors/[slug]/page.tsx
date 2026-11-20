// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { decode_param } from "@/lib/route-params";
import { get_server_api } from "@/lib/seo/server-api";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { PROFILE_VIEWS, page_alternates } from "@/lib/seo/alternates";
import { build_blog_author_jsonld, build_blog_author_metadata } from "@/lib/seo/build";
import { JsonLd } from "@/lib/seo/json-ld";
import { profile_path } from "@/lib/profile-path";
import { BLOG_PATH, blog_author_path, page_param } from "@/lib/blog-paths";
import { PageBreadcrumbs } from "@theme/components/page-breadcrumbs";
import { NORM_BLOG_AUTHOR } from "@/utils/NORMALIZERS/blog-post.normalizer";
import { AuthorPage } from "@theme/blog/author-page";
import { blog_author_model, blog_card_model, blog_pagination } from "@/lib/blog-models";
import { languages_with_posts, load_blog_posts } from "../../api.query";
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
  return { customer_country, api, slug, page, posts, language, author: raw ? NORM_BLOG_AUTHOR(raw, language) : null };
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
  const { customer_country, slug, page, posts, author, language } = await load(props);
  if (!author || !page || (page > 1 && !posts?.cards.length)) notFound();

  const { t } = await get_i18n();
  const crumbs = [{ name: t("blog.title"), path: BLOG_PATH }];

  return (
    <>
      <JsonLd data={build_blog_author_jsonld(author, { country: customer_country }, crumbs)} />
      <PageBreadcrumbs trail={[...crumbs.map(({ name, path }) => ({ name, href: path })), { name: author.name }]} />
      <AuthorPage
        t={t}
        author={blog_author_model(author)}
        posts={(posts?.cards ?? []).map((card) => blog_card_model(card, language))}
        pagination={blog_pagination(page, posts?.pages ?? 1, (n) =>
          profile_path(customer_country, n > 1 ? `${blog_author_path(slug)}?page=${n}` : blog_author_path(slug)),
        )}
      />
    </>
  );
}
