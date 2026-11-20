// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Media } from "@entirius/storefront-sdk/components/media";
import type { CmsPicture } from "@entirius/storefront-sdk/cms";
import { cn } from "@theme/lib/utils";

const FIT = { cover: "object-cover", contain: "object-contain" };

// A CMS picture at a fixed size, or across its box at the picture's ratio: `ratio` when given, else the picture's
// own, else 16:9 (the CMS often stores no size).
export function CmsImage({
  picture,
  className,
  fit = "cover",
  ratio,
  width,
  height,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: {
  picture: CmsPicture | null | undefined;
  className?: string;
  fit?: keyof typeof FIT;
  ratio?: number;
  width?: number;
  height?: number;
  // next/image `sizes` of the box; by default half the viewport from 768 px.
  sizes?: string;
}) {
  if (!picture) return null;

  if (width && height) {
    return (
      <Media src={picture.src} alt={picture.alt} width={width} height={height} className={cn(FIT[fit], className)} />
    );
  }

  const box_ratio = ratio ?? (picture.width && picture.height ? picture.width / picture.height : 16 / 9);
  return (
    <div className={cn("relative w-full overflow-hidden", className)} style={{ aspectRatio: box_ratio }}>
      <Media src={picture.src} alt={picture.alt} fill className={FIT[fit]} sizes={sizes} />
    </div>
  );
}
