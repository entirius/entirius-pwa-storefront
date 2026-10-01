// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React from "react";
import { cn } from "@/lib/utils";
import { SanitizeHTML } from "@/components/ui/sanitize-html";

// Title + description + a grid of tiles. Also renders `section-image-text`
// until it carries its own image (the seed has none).
export const grid_for = (count: number) =>
  count >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : count === 2 ? "md:grid-cols-2" : "";

export function SectionShell({
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
  return (
    <section
      className={cn(
        "flex flex-col gap-4 py-6",
        width === "full_width" ? "" : "mx-auto w-full max-w-6xl",
      )}
    >
      {(title || description) && (
        <header className="flex flex-col gap-1">
          {title && <h2 className="text-2xl">{title}</h2>}
          {description && (
            <SanitizeHTML html={description} className="text-sm text-muted-foreground" />
          )}
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
