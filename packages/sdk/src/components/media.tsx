// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState, type ComponentProps } from "react";
import Image from "next/image";
import { useStorefront } from "../storefront";

type MediaProps = Omit<ComponentProps<typeof Image>, "src"> & {
  src: string | null | undefined;
};

// A backend picture through next/image. A source the core does not allow, or one that fails to load, shows the
// placeholder: a small centred icon, never cropped or blown up by the picture's object-fit.
export function Media({ src, alt, onError, style, ...props }: MediaProps) {
  const { media_src, image_placeholder } = useStorefront();
  const resolved = media_src(src);
  const [failed, setFailed] = useState<string | null>(null);
  const shown = failed === resolved ? image_placeholder : resolved;

  return (
    <Image
      {...props}
      src={shown}
      style={shown === image_placeholder ? { ...style, objectFit: "contain" } : style}
      alt={alt}
      onError={(event) => {
        setFailed(resolved);
        onError?.(event);
      }}
    />
  );
}
