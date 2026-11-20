// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { MessagePageProps } from "@entirius/storefront-sdk/account";
import { Link } from "@entirius/storefront-sdk/components/link";
import { Button } from "@theme/ui/button";
import { Spinner } from "@theme/ui/spinner";

// The answer to a link from an email: a spinner while it is checked, then the result and a way back to the shop.
export function MessagePage({ pending, pending_text, title, text, action }: MessagePageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      {pending ? (
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-6" />
          {pending_text && <p className="text-muted-foreground">{pending_text}</p>}
        </div>
      ) : (
        <>
          {title && <h1 className={text ? "mb-3 text-2xl" : "mb-6 text-2xl"}>{title}</h1>}
          {text && <p className="mb-6 text-muted-foreground">{text}</p>}
          {action && (
            <Button asChild variant="outline">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          )}
        </>
      )}
    </div>
  );
}
