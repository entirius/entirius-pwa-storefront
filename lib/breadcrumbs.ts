// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Crumb } from "@entirius/storefront-sdk/layout";

// A category's path (root first) as breadcrumbs to its listings.
export function category_trail(path: { name?: string; url_key?: string }[] | undefined): Crumb[] {
  return (path ?? [])
    .filter((c) => c?.name)
    .map((c) => ({
      name: c.name as string,
      href: c.url_key ? `/catalog/${c.url_key}` : undefined,
    }));
}
