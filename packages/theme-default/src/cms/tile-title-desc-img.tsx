// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { BadgeCheck } from "lucide-react";
import type { CmsTileTitleDescImgProps } from "@entirius/storefront-sdk/cms";
import { Media } from "@entirius/storefront-sdk/components/media";
import { RichText } from "@entirius/storefront-sdk/components/rich-text";

// An icon, a title and a short text. Without an uploaded icon a neutral one stands in.
export function TileTitleDescImg({ title, description, icon }: CmsTileTitleDescImgProps) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-card bg-gradient-card p-5">
      <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        {icon ? (
          <Media src={icon.src} alt={icon.alt} fill sizes="48px" className="object-contain p-2" />
        ) : (
          <BadgeCheck className="size-6" aria-hidden />
        )}
      </div>
      <div className="flex flex-col gap-1">
        {title && <h3 className="text-lg">{title}</h3>}
        {description && <RichText html={description} className="text-sm text-muted-foreground" />}
      </div>
    </div>
  );
}
