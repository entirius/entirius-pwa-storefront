// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { get_i18n } from "@/lib/i18n/i18n.server";
import { get_server_api } from "@/lib/seo/server-api";
import { categories_query } from "./_components/layout/api.query";
import { CONFIG_QUERY } from "./_components/layout/menu-config";
import { Button } from "@/components/ui/button";
import { LinkDynamic } from "@/lib/link-dynamic";
import { NotFoundSearch } from "./_components/not-found-search.client";

// The top categories of the menu (`MENU_CINFGURATION.CONFIG_QUERY`), as the header shows them. The bare
// categories list answers the tree roots ("Root Category"), which are no shop categories. A failed request
// just leaves the links out.
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
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center">
      <div>
        <h1 className="mb-3 text-2xl font-bold">{t("notfound.title")}</h1>
        <p className="text-muted-foreground">{t("notfound.text")}</p>
      </div>
      <NotFoundSearch />
      {categories.length > 0 && (
        <nav
          aria-label={t("notfound.browse")}
          data-notfound-categories
          className="flex flex-wrap justify-center gap-2"
        >
          {categories.map((c) => (
            <Button key={c.url_key} asChild variant="outline" size="sm">
              <LinkDynamic href={`/catalog/${c.url_key}`}>{c.name}</LinkDynamic>
            </Button>
          ))}
        </nav>
      )}
      <Button asChild variant="ghost">
        <LinkDynamic href="/">{t("common.back_to_store")}</LinkDynamic>
      </Button>
    </div>
  );
}
