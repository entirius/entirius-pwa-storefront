// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { LinkDynamic } from "@/lib/link-dynamic";
import { useI18n } from "@/providers/i18n.provider";
import type { SpecGroup } from "@/utils/NORMALIZERS/product.normalizer";
import { filters_query } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/api.query";

type Category = { url_key: string; path?: unknown[] };

// The broadest category of the product (shortest path): its listing offers the most filters.
const filter_category = (categories: Category[] | undefined): string | undefined =>
  [...(categories ?? [])].sort((a, b) => (a.path?.length ?? 1) - (b.path?.length ?? 1))[0]?.url_key;

// Catalog link of one specification value: `/catalog/<category>?q_<idx>=<value>`, only when that attribute is a
// filter of the category and offers this value. Everything else stays plain text.
function useSpecLinks(categories: Category[] | undefined) {
  const api = useMemo(() => create_api(make_client_access()), []);
  const category = filter_category(categories);
  const { data: filters } = useQuery({
    ...filters_query(api, { category }),
    enabled: !!category,
    staleTime: 10 * 60_000,
  });
  return (idx: string | null, value_idx: string | null): string | null => {
    const filter = idx ? filters?.data?.q_?.[`q_${idx}`] : undefined;
    if (!category || !idx || !value_idx || !filter?.options.some((o: { idx: string }) => o.idx === value_idx)) return null;
    return `/catalog/${category}?q_${idx}=${encodeURIComponent(value_idx)}`;
  };
}

// Product parameters from the PIM (see NORM_SPEC_GROUPS). Ungrouped attributes
// go under the section heading itself. A value that is a filter of the product's
// category links to the filtered listing.
export function ProductSpecs({ groups, categories }: { groups: SpecGroup[]; categories?: Category[] }) {
  const { t } = useI18n();
  const link_for = useSpecLinks(categories);
  if (!groups.length) return null;
  return (
    <section
      aria-labelledby="product-specs"
      className="grid gap-6 md:grid-cols-[minmax(12rem,1fr)_3fr]"
    >
      <h2 id="product-specs" className="text-2xl md:text-3xl">
        {t("product.specifications")}
      </h2>
      <div className="flex flex-col gap-6">
        {groups.map((group, i) => (
          <div key={group.name ?? i} className="flex flex-col gap-2">
            {group.name && (
              <h3 className="text-base text-muted-foreground">{group.name}</h3>
            )}
            <dl className="grid gap-x-8 text-sm md:grid-cols-2">
              {group.rows.map((row) => (
                <div
                  key={row.name}
                  data-attribute={row.idx ?? undefined}
                  className="flex justify-between gap-4 border-b border-border py-3"
                >
                  <dt className="text-muted-foreground">{row.name}</dt>
                  <dd className="text-right font-medium text-heading">
                    {row.parts.map((part, n) => {
                      const href = link_for(row.idx, part.value_idx);
                      return (
                        <span key={part.label}>
                          {n > 0 && ", "}
                          {href ? (
                            <LinkDynamic href={href} className="underline underline-offset-2">
                              {part.label}
                            </LinkDynamic>
                          ) : (
                            part.label
                          )}
                        </span>
                      );
                    })}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
