// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { useProductPage } from "@entirius/storefront-sdk/product/page";

// The attributes, in their groups; a value the category filters by links to the filtered listing.
export function ProductSpecs() {
  const { t } = useI18n();
  const { product, spec_link } = useProductPage();
  const groups = product.specs;
  if (!groups.length) return null;
  const named = groups.length > 1;
  return (
    <div className="border-t pt-8">
    <section aria-labelledby="product-specs" className="flex flex-col gap-4">
      <h2 id="product-specs" className="text-xl">
        {t("product.specifications")}
      </h2>
      {groups.map((group, i) => (
        <div key={group.name ?? i} className="flex flex-col gap-2">
          {named && group.name && <h3 className="text-sm font-medium text-heading">{group.name}</h3>}
          <dl className="grid grid-cols-[minmax(0,8rem)_1fr] gap-x-4 gap-y-2 text-sm md:grid-cols-[minmax(0,10rem)_1fr]">
            {group.rows.map((row) => (
              <div key={row.name} data-attribute={row.idx ?? undefined} className="col-span-2 grid grid-cols-subgrid">
                <dt className="text-muted-foreground">{row.name}</dt>
                <dd className="text-heading">
                  {row.parts.map((part, n) => {
                    const href = spec_link(row.idx, part.value_idx);
                    return (
                      <span key={part.label}>
                        {n > 0 && ", "}
                        {href ? (
                          <Link href={href} className="underline underline-offset-2">
                            {part.label}
                          </Link>
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
    </section>
    </div>
  );
}
