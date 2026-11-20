// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Children, type ReactNode } from "react";
import type { CmsSectionTypeAProps } from "@entirius/storefront-sdk/cms";
import { RichText } from "@entirius/storefront-sdk/components/rich-text";
import { cn } from "@theme/lib/utils";
import { CmsButton } from "@theme/cms/buttons";

type TilesLayout = "horizontal" | "grid-2" | "vertical";

// The editor's colour (`dye`) and layout (`variant`) options.
const DYES: Record<number, { box: string; title: string; subtitle: string; text: string }> = {
  1: { box: "bg-gradient-backdrop", title: "text-heading", subtitle: "text-foreground", text: "var(--foreground)" },
  2: {
    box: "bg-card bg-gradient-card border border-border",
    title: "text-heading",
    subtitle: "text-link",
    text: "var(--muted-foreground)",
  },
  3: { box: "", title: "text-heading", subtitle: "text-muted-foreground", text: "var(--muted-foreground)" },
};

const ROW = {
  header: "flex flex-row items-center justify-between",
  buttons: "flex flex-row gap-2",
  title: "text-3xl font-bold",
  subtitle: "text-sm",
  description: "mt-3 text-lg",
};

const VARIANTS: Record<number, typeof ROW & { box: string; tiles: TilesLayout }> = {
  1: { ...ROW, box: "p-5", tiles: "horizontal" },
  2: { ...ROW, box: "p-5", tiles: "grid-2" },
  3: { ...ROW, box: "p-5", tiles: "vertical" },
  // A column of links (the footer): the title above, the buttons as a list. A column without buttons (a bottom
  // line, for example) takes the whole row of the grid it sits in.
  4: {
    box: "px-0 py-2",
    header: "flex flex-col gap-3",
    buttons: "flex flex-col items-start gap-1",
    title: "text-sm font-semibold uppercase tracking-wide",
    subtitle: "text-xs",
    description: "text-sm",
    tiles: "vertical",
  },
};

// Older content's section: title, subtitle, text (with a form inside when the editor placed its marker), buttons
// and tiles.
export function SectionTypeA({ title, subtitle, description, enquiry, links, dye, variant, children }: CmsSectionTypeAProps) {
  const colours = DYES[dye] ?? DYES[1];
  const layout = VARIANTS[variant] ?? VARIANTS[1];
  const text = { className: layout.description, style: { color: colours.text } };

  return (
    <div className={cn(layout.box, colours.box, variant === 4 && !links.length && "col-span-full")}>
      <div className={layout.header}>
        <div className="flex-1">
          {title && <h2 className={cn(layout.title, colours.title)}>{title}</h2>}
          {subtitle && <p className={cn(layout.subtitle, colours.subtitle)}>{subtitle}</p>}
        </div>
        {links.length > 0 && (
          <div className={layout.buttons}>
            {links.map((link, i) => (
              <CmsButton key={`${i}-${link.href}`} link={link} />
            ))}
          </div>
        )}
      </div>
      {enquiry ? (
        <>
          {enquiry.before && <RichText html={enquiry.before} {...text} />}
          <div className="mt-4 max-w-xl">{enquiry.form}</div>
          {enquiry.after && <RichText html={enquiry.after} {...text} />}
        </>
      ) : (
        description && <RichText html={description} {...text} />
      )}
      <Tiles layout={layout.tiles}>{children}</Tiles>
    </div>
  );
}

function Tiles({ layout, children }: { layout: TilesLayout; children?: ReactNode }) {
  const tiles = Children.toArray(children);
  if (!tiles.length) return null;
  if (layout === "horizontal") {
    return (
      <div className="scrollbar-hide -mx-5 flex gap-3 overflow-x-auto px-5 py-2">
        {tiles.map((tile, i) => (
          <div key={i} className="w-[70vw] max-w-[280px] shrink-0">
            {tile}
          </div>
        ))}
      </div>
    );
  }
  if (layout === "grid-2") return <div className="mt-2 grid grid-cols-2 gap-3">{tiles}</div>;
  return <div className="mt-2 flex flex-col gap-3">{tiles}</div>;
}
