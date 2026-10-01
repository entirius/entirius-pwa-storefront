// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import Link from "next/link";
import { useParams } from "next/navigation";

export function LinkDynamic({
  href,
  children,
  ...props
}: React.ComponentProps<typeof Link>) {
  const params = useParams();
  const country = params?.customer_country as string | undefined;

  const prefixedHref =
    !country || country === "default"
      ? href
      : `/${country}${href}`;

  return (
    <Link href={prefixedHref} {...props}>
      {children}
    </Link>
  );
}
