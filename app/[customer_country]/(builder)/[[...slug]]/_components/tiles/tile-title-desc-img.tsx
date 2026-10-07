// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { BadgeCheck } from "lucide-react";
import { SanitizeHTML } from "@/components/ui/sanitize-html";
import { MediaImage } from "@/components/ui/media-image.client";
import { normalize_image_source, type CmsImagesSet } from "../cms-image";

// Icon + title + short text. Without an uploaded icon a neutral one stands in.
export default function TileTitleDescImg({
  title,
  description,
  images_set,
}: {
  title?: string;
  description?: string;
  images_set?: CmsImagesSet;
}) {
  const icon = normalize_image_source(images_set);
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-gradient-card p-5">
      <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon ? (
          <MediaImage src={icon.uri} alt={icon.alt} fill sizes="48px" className="object-contain p-2" />
        ) : (
          <BadgeCheck className="size-6" aria-hidden />
        )}
      </div>
      <div className="flex flex-col gap-1">
        {title && <h3 className="text-base">{title}</h3>}
        {description && (
          <SanitizeHTML html={description} className="text-sm text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
