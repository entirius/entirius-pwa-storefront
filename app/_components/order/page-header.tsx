// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type * as React from "react";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LinkDynamic } from "@/lib/link-dynamic";

// The title row of the cart and checkout pages: one size, an optional line under it, a sync spinner.
export function OrderPageHeader({
  title,
  meta,
  busy,
}: {
  title: string;
  meta?: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        {busy && <Spinner className="size-4" />}
      </div>
      {meta && <p className="mt-1 text-muted-foreground">{meta}</p>}
    </div>
  );
}

// Nothing in the cart: the cart page and checkout say it the same way.
export function EmptyCart({ message, action, hint }: { message: string; action: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border px-4 py-12 text-center">
      <ShoppingBag className="size-10 text-muted-foreground" strokeWidth={1.25} aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-lg text-heading">{message}</p>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      <Button asChild>
        <LinkDynamic href="/">{action}</LinkDynamic>
      </Button>
    </div>
  );
}
