// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { decode_param } from "@/lib/route-params";
import { get_server_api } from "@/lib/seo/server-api";
import { load_static_page, pick_static_page, cms_content_prefetches } from "./api.query";
import { CmsPage as CmsPageFrame } from "@theme/cms/cms-page";
import { CmsDocument } from "./_components/cms-document";
import { own_heading_content, page_title } from "./_components/page-heading";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { LAYOUT_ROUTE_PREFIX } from "@/app/_components/layout-slots/api.query";
import { page_alternates } from "@/lib/seo/alternates";
import type { CmsPage } from "@/types/cms.types";
import { profile_path } from "@/lib/profile-path";
import { JsonLd } from "@/lib/seo/json-ld";
import { build_organization_jsonld } from "@/lib/seo/build";
import NotFound, { generateMetadata as not_found_metadata } from "@/app/not-found";

interface Props {
  params: Promise<{
    customer_country: string;
    slug?: string[];
  }>;
}

// Not CMS pages: slugs with dots are browser-internal paths (e.g. Chrome DevTools .json), and routes
// with the layout prefix hold layout slots (announcement, before-footer), which are not reachable as pages.
const is_page_route = (slug?: string[]) =>
  !slug?.some((s) => s.includes(".")) && !slug?.[0]?.startsWith(LAYOUT_ROUTE_PREFIX);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { customer_country, ...route } = await params;
  const slug = route.slug?.map(decode_param);
  if (!is_page_route(slug)) return { ...(await not_found_metadata()), robots: { index: false } };

  const [, cms_data] = await load_static_page(await get_server_api(), {
    routes: slug?.[0] ? [slug[0]] : ["home"],
  });
  const { language } = await get_i18n();
  const pages: CmsPage[] = cms_data?.data ?? [];
  const meta = pick_static_page(pages, language)?.meta;
  if (!pages.length) return {};
  // One address per page, and the same page in the profiles whose language it is written in.
  const path = slug?.[0] ? `/${slug[0]}` : "/";
  const languages = page_alternates(path, pages.flatMap((page) => (page.language ? [page.language] : [])));
  return {
    ...(meta?.title && { title: meta.title }),
    ...(meta?.description && { description: meta.description }),
    alternates: { canonical: profile_path(customer_country, path), languages },
  };
}

export default async function BuilderPage({ params }: Props) {
  const slug = (await params).slug?.map(decode_param);

  // Rendered, not notFound(): thrown inside the root <Suspense> it leaves the SSR HTML without the not-found UI
  // (React #419). Status stays 200, so generateMetadata sets noindex.
  if (!is_page_route(slug)) return <NotFound />;

  const routes = slug?.[0] ? [slug[0]] : ["home"];

  // One api per request (get_server_api), shared with generateMetadata and the document's blocks, so the page and
  // every product request are fetched once.
  const api = await get_server_api();
  const { language } = await get_i18n();
  const [, cms_data] = await load_static_page(api, { routes });
  const document = pick_static_page(cms_data?.data, language);

  if (!document) notFound();
  const { has_h1, content } = own_heading_content(document.content);

  return (
    <>
      {/* The shop's Organization goes on the home page, where search engines look for it. */}
      {!slug?.length && <JsonLd data={build_organization_jsonld()} />}
      <PrefetchBoundary prefetches={await cms_content_prefetches(api, content)}>
        <CmsPageFrame name={has_h1 ? null : page_title(document)}>
          <CmsDocument content={content} />
        </CmsPageFrame>
      </PrefetchBoundary>
    </>
  );
}
