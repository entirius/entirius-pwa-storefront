// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CATEGORY } from "@/app/_components/layout/menu-config";

// A category row of matrix `categories/`: the fields read here.
type RawCategory = {
  id?: string | number;
  idx?: string;
  url_key: string;
  name: string;
  has_children?: boolean;
  children?: unknown;
};

// `deep` keeps the nested rows: a `parent_url_key` response carries the whole subtree, while a `url_key` lookup
// nests one incomplete level.
function NORM_CATEGORIES_DATA(rows: unknown, deep = false): CATEGORY[] {
  if (!Array.isArray(rows)) return [];
  return (rows as RawCategory[]).map((row) => ({
    id: row.id ?? row.idx,
    url_key: row.url_key,
    name: row.name,
    has_children: Boolean(row.has_children),
    ...(deep && Array.isArray(row.children) && row.children.length
      ? { children: NORM_CATEGORIES_DATA(row.children, true) }
      : {}),
  }));
}

// One branch of the menu: the parent drops in as the first row of its own children, a leaf that links to the
// collective category. The views render it like any other row; its label comes from their message key.
function NORM_CATEGORY_BRANCH(parent: Pick<CATEGORY, "url_key" | "name">, children: CATEGORY[] = []): CATEGORY[] {
  return [{ url_key: parent.url_key, name: parent.name, has_children: false, is_self: true }, ...children];
}

export { NORM_CATEGORIES_DATA, NORM_CATEGORY_BRANCH };
