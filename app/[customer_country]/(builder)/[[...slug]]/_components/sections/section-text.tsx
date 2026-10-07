// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React from "react";
import { cn } from "@/lib/utils";
import { SanitizeHTML } from "@/components/ui/sanitize-html";
import { CmsButtons, type CmsButtonData } from "../cms-button";

// Title + description + a grid of tiles.
export const grid_for = (count: number) =>
  count >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : count === 2 ? "md:grid-cols-2" : "";

export function SectionShell({
  title,
  description,
  width,
  custom_buttons,
  children,
}: {
  title?: string;
  description?: string;
  width?: string;
  // Header-level links, e.g. "All chairs" next to a product section.
  custom_buttons?: CmsButtonData[];
  children?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 py-6",
        width === "full_width" ? "" : "w-full",
      )}
    >
      {(title || description || custom_buttons?.length) && (
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            {title && <h2 className="text-2xl">{title}</h2>}
            {description && (
              <SanitizeHTML html={description} className="text-sm text-muted-foreground" />
            )}
          </div>
          <CmsButtons buttons={custom_buttons} variant="outline" />
        </header>
      )}
      {children}
    </section>
  );
}

export default function SectionText({
  title,
  description,
  width,
  children,
}: {
  title?: string;
  description?: string;
  width?: string;
  children?: React.ReactNode;
}) {
  const tiles = React.Children.toArray(children);
  return (
    <SectionShell title={title} description={description} width={width}>
      {tiles.length > 0 && (
        <div className={cn("grid grid-cols-1 gap-4", grid_for(tiles.length))}>{tiles}</div>
      )}
    </SectionShell>
  );
}
