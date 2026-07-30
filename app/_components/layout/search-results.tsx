"use client";

import { Search, Tag } from "lucide-react";

import { LinkDynamic } from "@/lib/link-dynamic";
import type { SearchResponse } from "./search.query";
import { SearchProductRow } from "./search-product-row";

type SearchCategory = {
  idx?: string;
  name?: string;
  url_key?: string;
  products_count?: number;
};

export function SearchResults({
  data,
  currency,
  onNavigate,
  onPhrase,
}: {
  data: SearchResponse;
  currency: string;
  onNavigate: () => void;
  onPhrase: (text: string) => void;
}) {
  const phrases = data.phrases ?? [];
  const categories = (data.categories?.results ?? []) as SearchCategory[];
  const products = data.products?.results ?? [];
  const total = data.products?.total ?? products.length;

  if (!phrases.length && !categories.length && !products.length) {
    return (
      <p className="px-1 py-6 text-center text-sm text-muted-foreground">
        No results found.
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
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
            >
              <Search className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{p.text}</span>
            </button>
          ))}
        </section>
      )}

      {categories.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Categories
          </h3>
          <div className="flex flex-col gap-1">
            {categories.map((c) => (
              <LinkDynamic
                key={c.idx ?? c.url_key}
                href={`/catalog/${c.url_key}`}
                onClick={onNavigate}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
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
              </LinkDynamic>
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Products ({total})
          </h3>
          <div className="flex flex-col gap-2">
            {products.map((p, i) => (
              <SearchProductRow
                key={p.sku ?? p.url_key ?? i}
                product={p}
                currency={currency}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
