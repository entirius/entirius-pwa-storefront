// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { ReactNode } from "react";

// A CMS page: its blocks one under another. CMS documents have no heading field, so the document's name is the
// page's one H1, for screen readers and search engines. A server part.
export function CmsPage({ name, children }: { name: string | null; children: ReactNode }) {
  return (
    <div data-cms-document className="flex flex-col gap-4">
      {name && <h1 className="sr-only">{name}</h1>}
      {children}
    </div>
  );
}
