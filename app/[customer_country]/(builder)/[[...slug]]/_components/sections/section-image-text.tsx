// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React from "react";
import { cn } from "@/lib/utils";

// Image beside text: a `tile-image` and a `tile-txt-btn` (in either order),
// stacked on mobile.
export default function SectionImageText({
  width,
  margin,
  children,
}: {
  width?: string;
  margin?: boolean | string;
  children?: React.ReactNode;
}) {
  const tiles = React.Children.toArray(children);
  if (!tiles.length) return null;
  return (
    <section
      className={cn(
        "grid grid-cols-1 items-center gap-6 md:grid-cols-2",
        width === "full_width" ? "" : "w-full",
        String(margin) !== "false" && "py-6",
      )}
    >
      {tiles}
    </section>
  );
}
