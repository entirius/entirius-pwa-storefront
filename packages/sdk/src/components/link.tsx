// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useStorefront } from "../storefront";

// next/link for a shop path: the core adds the profile prefix of the current country.
export function Link({ href, children, ...props }: ComponentProps<typeof NextLink>) {
  const { useLocalHref } = useStorefront();
  const local = useLocalHref(typeof href === "string" ? href : "");
  return (
    <NextLink href={typeof href === "string" ? local : href} {...props}>
      {children}
    </NextLink>
  );
}
