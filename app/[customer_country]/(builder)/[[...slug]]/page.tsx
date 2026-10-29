// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { decode_param } from "@/lib/route-params";
import { create_api } from "@/API/api.context";
import { make_server_access } from "@/API/access/api.server-access";
import {
  load_static_page,
  pick_static_page,
  static_page_query,
  cms_content_prefetches,
} from "./api.query";
import { BuilderClient } from "./_components/builder.client";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { LAYOUT_ROUTE_PREFIX } from "@/app/_components/layout-slots/api.query";
import { page_alternates } from "@/lib/seo/alternates";
import type { CmsPage } from "@/types/cms.types";
import { profile_path } from "@/lib/profile-path";

interface Props {
  params: Promise<{
    customer_country: string;
    slug?: string[];
  }>;
}

// One api instance per request, shared by generateMetadata and the page so the page is fetched once.
const get_api = cache(async () => create_api(await make_server_access()));

// Not CMS pages: slugs with dots are browser-internal paths (e.g. Chrome DevTools .json), and routes
// with the layout prefix hold layout slots (announcement, before-footer), which are not reachable as pages.
const is_page_route = (slug?: string[]) =>
  !slug?.some((s) => s.includes(".")) && !slug?.[0]?.startsWith(LAYOUT_ROUTE_PREFIX);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { customer_country, ...route } = await params;
  const slug = route.slug?.map(decode_param);
  if (!is_page_route(slug)) return {};

  const [, cms_data] = await load_static_page(await get_api(), {
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

  if (!is_page_route(slug)) notFound();

  const routes = slug?.[0] ? [slug[0]] : ["home"];

  const api = await get_api();
  // ------------------------------------------------------------
  // Fetch CMS document first to extract what its sections read for batch prefetch.
  // load_static_page keys its React cache on the joined routes string, so the
  // second call inside PrefetchBoundary.queryFn costs no additional request.
  // ------------------------------------------------------------
  const { language } = await get_i18n();
  const options = { routes, language };
  const [, cms_data] = await load_static_page(api, options);
  const document = pick_static_page(cms_data?.data, language);

  if (!document) notFound();

  const prefetches = [
    static_page_query(api, options),
    ...(await cms_content_prefetches(api, document.content, language)),
  ];

  return (
    <PrefetchBoundary prefetches={prefetches}>
      <BuilderClient routes={routes} />
    </PrefetchBoundary>
  );
}
