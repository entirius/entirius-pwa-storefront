// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Link } from "@entirius/storefront-sdk/components/link";
import type { Translate } from "@entirius/storefront-sdk/i18n";
import { Button } from "@theme/ui/button";
import { NotFoundSearch } from "@theme/layout/not-found-search";

// The 404 page: what happened, the search, the menu's top categories (`categories`, the core reads them; empty when
// the request failed) and the way back. A server part.
export function NotFoundPage({ t, categories }: { t: Translate; categories: { name: string; href: string }[] }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center">
      <div>
        <h1 className="mb-3 text-2xl font-bold">{t("notfound.title")}</h1>
        <p className="text-muted-foreground">{t("notfound.text")}</p>
      </div>
      <NotFoundSearch />
      {categories.length > 0 && (
        <nav aria-label={t("notfound.browse")} data-notfound-categories className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <Button key={category.href} asChild variant="outline" size="sm">
              <Link href={category.href}>{category.name}</Link>
            </Button>
          ))}
        </nav>
      )}
      <Button asChild variant="ghost">
        <Link href="/">{t("common.back_to_store")}</Link>
      </Button>
    </div>
  );
}
