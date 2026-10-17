// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type * as React from "react";

import { cn } from "@/lib/utils";

// A full-width error box above a form or a list (cart sync, items that need attention).
// Field and form-level errors are FormMessage / FormError.
export function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(
        "rounded-md border border-destructive/50 bg-destructive-surface px-3 py-2 text-sm text-destructive",
        className,
      )}
      {...props}
    />
  );
}
