// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { decode_param } from "@/lib/route-params";
import { get_server_api } from "@/lib/seo/server-api";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { page_alternates } from "@/lib/seo/alternates";
import { build_blog_post_jsonld, build_blog_post_metadata } from "@/lib/seo/build";
import { JsonLd } from "@/lib/seo/json-ld";
import { PageBreadcrumbs } from "@theme/components/page-breadcrumbs";
import { PostPage } from "@theme/blog/post-page";
import { CmsDocument } from "@/app/[customer_country]/(builder)/[[...slug]]/_components/cms-document";
import { cms_content_prefetches } from "@/app/[customer_country]/(builder)/[[...slug]]/api.query";
import { NORM_BLOG_POST } from "@/utils/NORMALIZERS/blog-post.normalizer";
import { blog_post_model } from "@/lib/blog-models";
import { BLOG_PATH, blog_post_path } from "@/lib/blog-paths";
import { load_blog_post } from "./api.query";

// A published contentdb `blog-post`: rendered on the server (text for crawlers, JSON-LD, the table of contents'
// anchors), its builder content by the CMS renderer with the same prefetches as a CMS page.

interface Props {
  params: Promise<{ customer_country: string; slug: string }>;
}

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
      <PostPage
        t={t}
        post={blog_post_model(post, language)}
        body={
          <PrefetchBoundary prefetches={await cms_content_prefetches(api, post.content)}>
            <CmsDocument content={post.content} />
          </PrefetchBoundary>
        }
      />
    </>
  );
}
