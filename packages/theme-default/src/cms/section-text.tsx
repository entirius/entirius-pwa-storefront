// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Children } from "react";
import type { CmsSectionTextProps } from "@entirius/storefront-sdk/cms";
import { cn } from "@theme/lib/utils";
import { grid_for } from "@theme/lib/cms";
import { SectionShell } from "@theme/cms/section-shell";

// Title, description and a grid of tiles.
export function SectionText({ t, title, description, width, children }: CmsSectionTextProps) {
  const tiles = Children.toArray(children);
  return (
    <SectionShell t={t} title={title} description={description} width={width}>
      {tiles.length > 0 && <div className={cn("grid grid-cols-1 gap-4", grid_for(tiles.length))}>{tiles}</div>}
    </SectionShell>
  );
}
