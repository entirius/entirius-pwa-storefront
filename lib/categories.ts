// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

export type ProductCategory = {
  idx?: string;
  name: string;
  url_key: string;
  path?: { name: string; url_key: string }[];
};

// The category that describes a product best: the one with the deepest path.
export function primary_category(categories?: ProductCategory[] | null): ProductCategory | null {
  return [...(categories ?? [])].sort((a, b) => (b.path?.length ?? 1) - (a.path?.length ?? 1))[0] ?? null;
}
