// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { SpecGroup } from "@/utils/NORMALIZERS/product.normalizer";

// Product parameters from the PIM (see NORM_SPEC_GROUPS). Ungrouped attributes
// go under the section heading itself.
export function ProductSpecs({ groups }: { groups: SpecGroup[] }) {
  if (!groups.length) return null;
  return (
    <section
      aria-labelledby="product-specs"
      className="grid gap-6 md:grid-cols-[minmax(12rem,1fr)_3fr]"
    >
      <h2 id="product-specs" className="text-2xl md:text-3xl">
        Specifications
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
                  className="flex justify-between gap-4 border-b border-border py-3"
                >
                  <dt className="text-muted-foreground">{row.name}</dt>
                  <dd className="text-right font-medium text-heading">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
