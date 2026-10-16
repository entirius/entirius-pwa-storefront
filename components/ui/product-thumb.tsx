// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { MediaImage } from "@/components/ui/media-image.client";
import { cn } from "@/lib/utils";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";

// A product picture in a line (cart, checkout summary, search row, added-to-cart notice): the product ratio, one
// radius, the placeholder without a picture. The width comes in className (w-16, w-20 md:w-24…), `sizes` must match.
export function ProductThumb({
  src,
  alt,
  sizes,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-product shrink-0 self-start overflow-hidden rounded-md bg-muted", className)}>
      <MediaImage src={src ?? image_placeholder} alt={alt} fill sizes={sizes} className="object-cover" />
    </div>
  );
}
