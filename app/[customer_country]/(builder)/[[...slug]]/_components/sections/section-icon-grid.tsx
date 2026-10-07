// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React from "react";
import { cn } from "@/lib/utils";
import { SectionShell } from "./section-text";

// Benefits / USP row: up to six `tile-title-desc-img` children.
export default function SectionIconGrid({
  title,
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  const tiles = React.Children.toArray(children);
  if (!tiles.length) return null;
  return (
    <SectionShell title={title}>
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2",
          tiles.length >= 3 && "lg:grid-cols-3",
          tiles.length >= 4 && "xl:grid-cols-4",
        )}
      >
        {tiles}
      </div>
    </SectionShell>
  );
}
