// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ReactNode } from "react";
import { AccountMenu } from "@theme/account/account-menu";

// The account section's frame: the menu in a side column (a row of pills on phones), the page beside it.
export function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid w-full gap-6 py-4 md:grid-cols-[15rem_minmax(0,1fr)] md:items-start">
      <div className="md:sticky md:top-24">
        <AccountMenu />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
