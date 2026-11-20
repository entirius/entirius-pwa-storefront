// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Children } from "react";
import type { CmsSectionImageTextProps } from "@entirius/storefront-sdk/cms";
import { cn } from "@theme/lib/utils";
import { FULL_BLEED_CLASS, is_full_width } from "@theme/lib/cms";

// A picture beside text (a `tile-image` and a `tile-txt-btn`, in either order), stacked on phones.
export function SectionImageText({ width, spaced, children }: CmsSectionImageTextProps) {
  const tiles = Children.toArray(children);
  if (!tiles.length) return null;
  return (
    <section
      data-width={width}
      className={cn(
        "grid grid-cols-1 items-center gap-6 md:grid-cols-2",
        is_full_width(width) ? cn(FULL_BLEED_CLASS, "px-4") : "w-full",
        spaced && "py-6",
      )}
    >
      {tiles}
    </section>
  );
}
