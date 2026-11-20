// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsTileHeroProps } from "@entirius/storefront-sdk/cms";
import { Media } from "@entirius/storefront-sdk/components/media";
import { RichText } from "@entirius/storefront-sdk/components/rich-text";
import { cn } from "@theme/lib/utils";
import { is_full_width } from "@theme/lib/cms";
import { CmsButtons } from "@theme/cms/buttons";

// The editor's colour variants (`dye` 1–5) on the theme's surfaces: `primary` carries white text, the others the
// heading colour.
const DYES: Record<number, { card: string; media: string; text: string; muted: string }> = {
  1: { card: "bg-card", media: "bg-accent", text: "text-heading", muted: "text-muted-foreground" },
  2: { card: "bg-accent", media: "bg-card", text: "text-accent-foreground", muted: "text-accent-foreground" },
  3: { card: "bg-secondary", media: "bg-accent", text: "text-heading", muted: "text-muted-foreground" },
  4: { card: "bg-primary", media: "bg-primary", text: "text-primary-foreground", muted: "text-primary-foreground" },
  5: { card: "bg-card", media: "bg-muted", text: "text-heading", muted: "text-muted-foreground" },
};

// Copy beside its picture, stacked when narrow. Sized by its parent through container queries: a slide of
// `section-hero-slider`, a card in a grid section, or the `section-banner` strip (`shape="banner"`).
export function TileHero({ title, description, pictures, links, image_first, dye, shape, width }: CmsTileHeroProps) {
  const full_width = is_full_width(width);
  const style = DYES[dye] ?? DYES[1];
  const desktop = pictures.desktop ?? pictures.mobile;
  const mobile = pictures.mobile ?? pictures.desktop;

  return (
    <div className="@container w-full" data-width={width}>
      <div data-hero-card className={cn("grid w-full overflow-hidden @3xl:grid-cols-2", !full_width && "rounded-4xl", style.card)}>
        <div
          data-hero-content
          className={cn("flex flex-col justify-center gap-4 p-6 @md:p-8 @5xl:p-14", image_first && "@3xl:order-2", style.text)}
        >
          {title && <h2 className={cn("text-3xl leading-tight @5xl:text-5xl", style.text)}>{title}</h2>}
          {description && <RichText html={description} className={cn("max-w-md @3xl:text-lg", style.muted)} />}
          <div className="pt-2">
            <CmsButtons links={links} size="lg" look={dye === 4 ? "secondary" : "default"} />
          </div>
        </div>
        <div
          data-hero-media
          className={cn("relative isolate min-h-56", shape === "banner" ? "@3xl:min-h-72" : "@3xl:min-h-96", style.media)}
        >
          {mobile && (
            <Media src={mobile.src} alt={mobile.alt} fill sizes="100vw" className="object-cover @3xl:hidden" />
          )}
          {desktop && (
            <Media
              src={desktop.src}
              alt={desktop.alt}
              fill
              // A half-width card in the container; the whole viewport when full width.
              sizes={full_width ? "100vw" : "50vw"}
              className="hidden object-cover @3xl:block"
            />
          )}
        </div>
      </div>
    </div>
  );
}
