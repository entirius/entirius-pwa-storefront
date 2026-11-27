// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { ReactNode } from "react";
import { Header } from "@theme/layout/header";
import { Footer } from "@theme/layout/footer";

// The frame around every page: the announcement bar and the header above the page, the slot above the footer and
// the footer below. `announcement` and `before_footer` are CMS content the core renders, null without a page under
// their route; `data-layout-slot` names them for a client theme's rules. A server part: the header and footer are
// browser parts inside. The frame clips what sticks out sideways: a full-bleed CMS section is `100vw` wide and a
// viewport with a vertical scrollbar is that much wider than the page, so without the clip the page scrolls
// sideways by the scrollbar's half width (`clip`, not `hidden`: no scroll container, the header stays sticky).
export function PageShell({
  announcement,
  before_footer,
  children,
}: {
  announcement: ReactNode | null;
  before_footer: ReactNode | null;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-clip">
      {announcement && (
        <div data-layout-slot="announcement" className="text-center text-sm">
          {announcement}
        </div>
      )}
      <Header />
      <main className="mx-auto w-full max-w-(--page-max-width) p-4">{children}</main>
      {before_footer && (
        <div data-layout-slot="before-footer" className="mx-auto w-full max-w-(--page-max-width) px-4">
          {before_footer}
        </div>
      )}
      <Footer />
    </div>
  );
}
