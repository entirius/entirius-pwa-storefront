// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cn } from "@/lib/utils";
import { SanitizeHTML } from "@/components/ui/sanitize-html";
import { MediaImage } from "@/components/ui/media-image.client";
import { CmsButtons, type CmsButtonData } from "../cms-button";
import { normalize_image_source, type CmsImagesSet } from "../cms-image";

// `dye` is the editor's colour variant (1–5); the palette belongs to the
// storefront and maps onto semantic surfaces. `primary` carries white text, the
// others the theme's heading colour.
const hero_dyes: Record<number, { card: string; media: string; text: string; muted: string }> = {
  1: { card: "bg-card", media: "bg-accent", text: "text-heading", muted: "text-muted-foreground" },
  2: { card: "bg-accent", media: "bg-card", text: "text-accent-foreground", muted: "text-accent-foreground" },
  3: { card: "bg-secondary", media: "bg-accent", text: "text-heading", muted: "text-muted-foreground" },
  4: { card: "bg-primary", media: "bg-primary", text: "text-primary-foreground", muted: "text-primary-foreground" },
  5: { card: "bg-card", media: "bg-muted", text: "text-heading", muted: "text-muted-foreground" },
};

// Hero tile: copy beside its image (the image side follows `tile_align`),
// stacked when narrow. Sized by its parent via container queries — a slide in
// `section-hero-slider`, a card inside a grid section, or the `section-banner`
// strip (`shape="banner"`, always on the filled accent surface).
export default function TileHero({
  title,
  description,
  images_set,
  custom_buttons,
  tile_align = "left",
  dye = 1,
  shape = "slide",
}: {
  title?: string;
  description?: string;
  images_set?: CmsImagesSet;
  custom_buttons?: CmsButtonData[];
  tile_align?: string;
  dye?: number;
  // `banner` is the `section-banner` strip.
  shape?: "slide" | "banner";
}) {
  const desktop = normalize_image_source(images_set, "desktop");
  const mobile = normalize_image_source(images_set, "mobile");
  const style = shape === "banner" ? hero_dyes[4] : (hero_dyes[dye] ?? hero_dyes[1]);
  const image_first = tile_align === "right";

  return (
    <div className="@container w-full">
      <div
        className={cn(
          "grid w-full overflow-hidden rounded-4xl @3xl:grid-cols-2",
          style.card,
        )}
      >
        <div
          className={cn(
            "flex flex-col justify-center gap-4 p-6 @md:p-8 @5xl:p-14",
            image_first && "@3xl:order-2",
            style.text,
          )}
        >
          {title && (
            <h2 className={cn("text-3xl leading-tight @5xl:text-5xl", style.text)}>{title}</h2>
          )}
          {description && (
            <SanitizeHTML html={description} className={cn("max-w-md @3xl:text-lg", style.muted)} />
          )}
          <div className="pt-2">
            <CmsButtons
              buttons={custom_buttons}
              size="lg"
              variant={shape === "banner" || dye === 4 ? "secondary" : "default"}
            />
          </div>
        </div>
        <div
          className={cn(
            "relative isolate min-h-56",
            shape === "banner" ? "@3xl:min-h-72" : "@3xl:min-h-96",
            style.media,
          )}
        >
          {mobile && (
            <MediaImage
              src={mobile.uri}
              alt={mobile.alt}
              fill
              sizes="100vw"
              className="object-cover @3xl:hidden"
            />
          )}
          {desktop && (
            <MediaImage
              src={desktop.uri}
              alt={desktop.alt}
              fill
              sizes="50vw"
              className="hidden object-cover @3xl:block"
            />
          )}
        </div>
      </div>
    </div>
  );
}
