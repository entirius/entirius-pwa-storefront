// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Children } from "react";
import type { CmsSectionIconGridProps } from "@entirius/storefront-sdk/cms";

// The test theme's benefits row: a server part like the default one, the benefits in one column. Its tiles stay
// the default theme's.
export function SectionIconGrid({ title, children }: CmsSectionIconGridProps) {
  const tiles = Children.toArray(children);
  if (!tiles.length) return null;
  return (
    <section data-theme-example-benefits className="flex w-full flex-col gap-4 py-8">
      {title && <h2 className="text-3xl">{title}</h2>}
      <div className="grid max-w-xl grid-cols-1 gap-3">{tiles}</div>
    </section>
  );
}
