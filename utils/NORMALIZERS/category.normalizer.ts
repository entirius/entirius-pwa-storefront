// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CATEGORY } from "@/app/_components/layout/menu-config";

function NORM_CATEGORIES_DATA(rows: any): CATEGORY[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row: any) => ({
    id: row.id ?? row.idx,
    url_key: row.url_key,
    name: row.name,
    has_children: Boolean(row.has_children),
  }));
}

export { NORM_CATEGORIES_DATA };
