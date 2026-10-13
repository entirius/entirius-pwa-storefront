// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { get_i18n } from "@/lib/i18n/i18n.server";
import { API_CATEGORIES_ROUTE } from "@/API/api.routes";
import { get_server_api } from "@/lib/seo/server-api";
import { NORM_CATEGORIES_DATA } from "@/utils/NORMALIZERS/category.normalizer";
import { Button } from "@/components/ui/button";
import { LinkDynamic } from "@/lib/link-dynamic";
import { NotFoundSearch } from "./_components/not-found-search.client";

// Root categories; a failed request just leaves the links out.
async function root_categories() {
  const api = await get_server_api();
  const [error, rows] = await api.FETCH_METHOD(API_CATEGORIES_ROUTE);
  return error ? [] : NORM_CATEGORIES_DATA(rows);
}

export default async function NotFound() {
  const { t } = await get_i18n();
  const categories = await root_categories();
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
