// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { ReactNode } from "react";
import type { CmsTileTypeAProps } from "@entirius/storefront-sdk/cms";
import { Media } from "@entirius/storefront-sdk/components/media";
import { RichText } from "@entirius/storefront-sdk/components/rich-text";
import { cn } from "@theme/lib/utils";
import { CmsButton } from "@theme/cms/buttons";
import { CmsImage } from "@theme/cms/picture";

// The editor's colour (`dye`) and layout (`variant`) options: 1 picture above the text, 2 the text over the
// picture, 3 a small picture beside it.
const DYES: Record<number, { box: string; content: string; title: string; subtitle: string; text: string }> = {
  1: {
    box: "bg-card bg-gradient-card",
    content: "",
    title: "text-heading",
    subtitle: "text-muted-foreground",
    text: "var(--muted-foreground)",
  },
  2: {
    box: "bg-card",
    content: "bg-gradient-to-t from-background/90 to-transparent",
    title: "text-heading",
    subtitle: "text-foreground",
    text: "var(--heading)",
  },
};

const VARIANTS: Record<number, { box: string; content: string; title: string; subtitle: string }> = {
  1: { box: "overflow-hidden rounded-xl shadow-sm", content: "p-2", title: "text-base font-semibold", subtitle: "text-xs tracking-wide" },
  2: {
    box: "relative aspect-square w-full overflow-hidden rounded-xl shadow-sm",
    content: "relative z-raised flex flex-col justify-end p-4",
    title: "text-base font-bold",
    subtitle: "text-xs",
  },
  3: {
    box: "flex flex-row items-center overflow-hidden rounded-xl px-2",
    content: "flex flex-1 flex-col justify-center p-4",
    title: "text-base font-semibold",
    subtitle: "text-xs",
  },
};

// Older content's tile: a picture, subtitle, title, text and buttons.
export function TileTypeA({ title, subtitle, description, links, dye, variant, pictures }: CmsTileTypeAProps) {
  const colours = DYES[dye] ?? DYES[1];
  const shape = VARIANTS[variant] ? variant : 1;
  const layout = VARIANTS[shape];
  const picture = pictures ? (pictures.desktop ?? pictures.mobile) : null;

  let media: ReactNode = null;
  if (picture && shape === 2) {
    media = <Media src={picture.src} alt={picture.alt} fill className="rounded-xl object-cover" sizes="(max-width: 768px) 100vw, 50vw" />;
  } else if (pictures && shape === 3) {
    media = (
      <div className="aspect-square w-[100px] shrink-0 overflow-hidden rounded-xl shadow-sm">
        <CmsImage picture={picture} width={100} height={100} />
      </div>
    );
  } else if (pictures) {
    media = <CmsImage picture={picture} className={cn("aspect-[16/10] w-full", shape === 1 && "rounded-t-xl")} />;
  }

  return (
    <div className={cn(layout.box, colours.box)}>
      {media}
      <div className={cn(layout.content, shape === 2 && colours.content)}>
        {subtitle && <p className={cn(layout.subtitle, colours.subtitle)}>{subtitle}</p>}
        {title && <h3 className={cn(layout.title, colours.title)}>{title}</h3>}
        {description && <RichText html={description} className="text-sm" style={{ color: colours.text }} />}
        {links.length > 0 && (
          <div className={cn("flex flex-row gap-2", shape === 3 && "mt-1")}>
            {links.map((link, i) => (
              <CmsButton key={`${i}-${link.href}`} link={link} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
