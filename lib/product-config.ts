// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import appConfig from "@/_CONFIG/app.config.json";

export type KeyFactConfig = { idx: string; label?: string };

type Settings = {
  PRODUCT?: {
    RELATED?: string[];
    KEY_FACTS?: (string | KeyFactConfig)[];
    STORY_ATTRIBUTES?: string[];
  };
  CATALOG?: { SORT_IN_STOCK_FIRST?: boolean };
};

const { PRODUCT: product = {}, CATALOG: catalog = {} } = appConfig as Settings;

// Similar products: a list of rules tried in order, each one attribute idxs and/or "category" joined with "+"
// (all must match). The first rule fills the section, the next ones top it up. Default: the product's category.
export const RELATED_RULES: string[] = product.RELATED ?? ["category"];

// Up to three attributes printed as one line under the price: an idx or { idx, label }. Default: none.
export const KEY_FACTS: KeyFactConfig[] = (product.KEY_FACTS ?? [])
  .slice(0, 3)
  .map((fact) => (typeof fact === "string" ? { idx: fact } : fact));

// Attribute idxs rendered as their own long-text section even when the value is not HTML. Default: none.
export const STORY_ATTRIBUTES: string[] = product.STORY_ATTRIBUTES ?? [];

// A chosen catalog sort keeps in-stock products before sold-out ones. Default off: the API order is kept.
export const SORT_IN_STOCK_FIRST: boolean = catalog.SORT_IN_STOCK_FIRST ?? false;
