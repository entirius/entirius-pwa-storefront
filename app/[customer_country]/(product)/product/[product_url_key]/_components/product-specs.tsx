// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { SpecGroup } from "@/utils/NORMALIZERS/product.normalizer";

// Product parameters from the PIM (see NORM_SPEC_GROUPS). Ungrouped attributes
// go under the section heading itself.
export function ProductSpecs({ groups }: { groups: SpecGroup[] }) {
  if (!groups.length) return null;
  return (
    <section aria-labelledby="product-specs" className="flex flex-col gap-4">
      <h2 id="product-specs" className="text-2xl md:text-3xl">
        Specifications
      </h2>
      {groups.map((group, i) => (
        <div key={group.name ?? i} className="flex flex-col gap-2">
          {group.name && (
            <h3 className="text-sm text-muted-foreground">{group.name}</h3>
          )}
          <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] text-sm md:max-w-3xl">
            {group.rows.map((row) => (
              <div key={row.name} className="contents">
                <dt className="border-b border-border py-2 pr-6 text-muted-foreground">
                  {row.name}
                </dt>
                <dd className="border-b border-border py-2">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </section>
  );
}
