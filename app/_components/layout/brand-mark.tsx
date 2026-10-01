// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import Image from "next/image";
import { BRAND, SITE_NAME } from "@/_CONFIG/app.config.json";

const logo = BRAND.LOGO as string | null;
const logo_alt = (BRAND.LOGO_ALT as string | null) ?? SITE_NAME;

// The identity slot: the configured logo (`_CONFIG/brand/`, served by
// app/brand/[file]) or, without one, the shop name as a Lexend Deca wordmark.
// Fixed height, so swapping identities never shifts the header.
export function BrandMark() {
  return (
    <span className="flex h-8 items-center">
      {logo ? (
        <Image
          src={`/brand/${logo}`}
          alt={logo_alt}
          width={160}
          height={32}
          unoptimized
          priority
          className="h-8 w-auto"
        />
      ) : (
        <span className="font-brand text-2xl font-light tracking-brand text-heading">
          {SITE_NAME}
        </span>
      )}
    </span>
  );
}
