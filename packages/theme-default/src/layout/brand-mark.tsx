// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import Image from "next/image";
import { useLayout } from "@entirius/storefront-sdk/layout/context";

// The shop's logo (`_CONFIG/brand/`), or its name when there is none.
export function BrandMark() {
  const { site } = useLayout();
  return (
    <span className="flex h-8 min-w-0 items-center">
      {site.logo ? (
        <Image
          src={`/brand/${site.logo}`}
          alt={site.logo_alt}
          width={160}
          height={32}
          unoptimized
          priority
          className="h-8 w-auto max-w-full object-contain object-left"
        />
      ) : (
        <span className="truncate font-brand text-2xl font-normal tracking-brand text-heading">{site.name}</span>
      )}
    </span>
  );
}
