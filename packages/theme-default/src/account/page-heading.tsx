// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "@entirius/storefront-sdk/components/link";
import { Button } from "@theme/ui/button";

// A sub-page's heading: a way back, the title, and what goes beside it (a status, a button).
export function PageHeading({
  back,
  title,
  children,
}: {
  back: { href: string; label: string };
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="icon">
        <Link href={back.href} aria-label={back.label}>
          <ChevronLeft className="size-5" />
        </Link>
      </Button>
      <h1 className="text-2xl">{title}</h1>
      {children}
    </div>
  );
}
