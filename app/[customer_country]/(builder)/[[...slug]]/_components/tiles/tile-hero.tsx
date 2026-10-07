// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cn } from "@/lib/utils";
import { SanitizeHTML } from "@/components/ui/sanitize-html";
import { MediaImage } from "@/components/ui/media-image.client";
import { CmsButtons, type CmsButtonData } from "../cms-button";
import { normalize_image_source, type CmsImagesSet } from "../cms-image";

// `dye` is the editor's colour variant (1–5); the palette belongs to the
// storefront and maps onto brand surfaces (styleguide §3). Text is always the
// heading colour — every overlay ends in brand black under the copy.
const hero_dyes: Record<number, { overlay: string; text: string }> = {
  1: { overlay: "bg-gradient-fade", text: "text-heading" },
  2: { overlay: "bg-gradient-backdrop opacity-85", text: "text-heading" },
  3: { overlay: "bg-background/60", text: "text-heading" },
  4: { overlay: "bg-gradient-card opacity-90", text: "text-heading" },
  5: { overlay: "bg-gradient-to-t from-background/80 to-transparent", text: "text-heading" },
};

const align_classes: Record<string, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

// Hero tile: full-bleed slide inside `section-hero-slider`, a card inside a
// grid section (e.g. `section-text` on product-showcase) — sized by its parent.
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
  // `banner` is the shorter `section-banner` strip.
  shape?: "slide" | "banner";
}) {
  const desktop = normalize_image_source(images_set, "desktop");
  const mobile = normalize_image_source(images_set, "mobile");
  const style = hero_dyes[dye] ?? hero_dyes[1];

  // Sized by the parent, not the viewport (container queries): a slider slide
  // is wide, a grid cell narrow.
  return (
    <div className="@container w-full">
      <div
        className={cn(
          "relative isolate flex w-full overflow-hidden rounded-md bg-muted",
          shape === "banner"
            ? "aspect-[4/3] @xl:aspect-[21/9] @5xl:aspect-[4/1]"
            : "aspect-[4/5] @xl:aspect-[16/9] @5xl:aspect-[21/9]",
        )}
      >
        {mobile && (
          <MediaImage
            src={mobile.uri}
            alt={mobile.alt}
            fill
            sizes="100vw"
            className="-z-10 object-cover @xl:hidden"
          />
        )}
        {desktop && (
          <MediaImage
            src={desktop.uri}
            alt={desktop.alt}
            fill
            sizes="100vw"
            className="-z-10 hidden object-cover @xl:block"
          />
        )}
        <div className={cn("absolute inset-0 -z-10", style.overlay)} aria-hidden />

        <div
          className={cn(
            "mt-auto flex w-full flex-col gap-3 p-6 @3xl:p-10",
            align_classes[tile_align] ?? align_classes.left,
            style.text,
          )}
        >
          {title && <h2 className="text-2xl @3xl:text-4xl">{title}</h2>}
          {description && (
            <SanitizeHTML html={description} className="max-w-xl text-sm @3xl:text-base" />
          )}
          <CmsButtons buttons={custom_buttons} />
        </div>
      </div>
    </div>
  );
}
