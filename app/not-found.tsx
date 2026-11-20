// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Metadata } from "next";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { get_server_api } from "@/lib/seo/server-api";
import { categories_query } from "@/lib/layout/menu.query";
import { CONFIG_QUERY } from "@/lib/layout/menu-config";
import { NotFoundPage } from "@theme/layout/not-found-page";

// The top categories of the menu (`MENU_CINFGURATION.CONFIG_QUERY`), as the header shows them. The bare
// categories list answers the tree roots ("Root Category"), which are no shop categories. A failed request
// just leaves the links out.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await get_i18n();
  return { title: t("notfound.title") };
}

async function top_categories() {
  const api = await get_server_api();
  try {
    return (await categories_query(api, CONFIG_QUERY).queryFn()).data;
  } catch {
    return [];
  }
}

export default async function NotFound() {
  const { t } = await get_i18n();
  const categories = await top_categories();
  return (
    <NotFoundPage t={t} categories={categories.map((c) => ({ name: c.name, href: `/catalog/${c.url_key}` }))} />
  );
}
