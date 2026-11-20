// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Search, Tag } from "lucide-react";

import { Link } from "@entirius/storefront-sdk/components/link";
import type { SearchResults as Results } from "@entirius/storefront-sdk/layout";
import { Button } from "@theme/ui/button";
import { SearchProductRow } from "@theme/layout/search-product-row";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

export function SearchResults({
  data,
  query,
  onNavigate,
  onPhrase,
}: {
  data: Results;
  // The searched phrase: the products end with a link to all its results.
  query?: string;
  onNavigate: () => void;
  onPhrase: (text: string) => void;
}) {
  const { t } = useI18n();
  const phrases = data.phrases ?? [];
  const categories = data.categories?.results ?? [];
  const products = data.products?.results ?? [];
  const total = data.products?.total ?? products.length;

  if (!phrases.length && !categories.length && !products.length) {
    return (
      <p className="px-1 py-6 text-center text-sm text-muted-foreground">
        {t("search.no_results")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {phrases.length > 0 && (
        <section className="flex flex-col gap-1">
          {phrases.map((p) => (
            <button
              key={p.text}
              type="button"
              onClick={() => onPhrase(p.text)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 pointer-coarse:min-h-touch text-left text-sm transition-colors hover:bg-accent"
            >
              <Search className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{p.text}</span>
            </button>
          ))}
        </section>
      )}

      {categories.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="px-1 text-xs tracking-wide text-muted-foreground uppercase">
            {t("search.categories")}
          </h3>
          <div className="flex flex-col gap-1">
            {categories.map((c) => (
              <Link
                key={c.idx ?? c.url_key}
                href={`/catalog/${c.url_key}`}
                onClick={onNavigate}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 pointer-coarse:min-h-touch text-sm transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-2 truncate">
                  <Tag className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{c.name}</span>
                </span>
                {typeof c.products_count === "number" &&
                  c.products_count > 0 && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {c.products_count}
                    </span>
                  )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="px-1 text-xs tracking-wide text-muted-foreground uppercase">
            {t("search.products", { total })}
          </h3>
          <div className="flex flex-col gap-2">
            {products.map((p, i) => (
              <SearchProductRow
                key={p.sku || p.href || i}
                product={p}
                onNavigate={onNavigate}
              />
            ))}
          </div>
          {query && (
            <Button asChild variant="link" size="sm" className="self-start px-1">
              <Link href={`/search?q=${encodeURIComponent(query)}`} onClick={onNavigate} data-search-all>
                {t("search.show_all")}
              </Link>
            </Button>
          )}
        </section>
      )}
    </div>
  );
}
