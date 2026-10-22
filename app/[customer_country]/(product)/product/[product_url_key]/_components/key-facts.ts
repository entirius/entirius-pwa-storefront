// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { KeyFactConfig } from "@/lib/product-config";

type Attribute = {
  feature_idx?: string;
  feature_name?: string;
  feature_type?: string;
  value?: string | null;
  is_visible?: boolean;
};

// "Height (cm)" -> label "Height", unit "cm".
const NAME_WITH_UNIT = /^(.*?)\s*\(([^)]+)\)\s*$/;

// One fact: a number prints as "<label> <value> <unit>" (label = attribute name without its unit, or the configured
// one), any other value as the value alone. null when the product has no value.
function fact(attributes: Attribute[], { idx, label }: KeyFactConfig, language: string): string | null {
  const rows = attributes.filter((a) => a.feature_idx === idx && a.is_visible && a.value);
  if (!rows.length) return null;
  const numeric = ["DECIMAL", "INTEGER"].includes(rows[0].feature_type ?? "") && Number.isFinite(Number(rows[0].value));
  if (!numeric) return rows.map((a) => a.value).join(" / ");
  const [, base, unit] = NAME_WITH_UNIT.exec(rows[0].feature_name ?? "") ?? [, rows[0].feature_name, ""];
  const value = Number(rows[0].value).toLocaleString(language);
  return [label ?? base, value, unit].filter(Boolean).join(" ");
}

// The configured facts the product has, joined into one line ("" when none).
export function key_facts_line(attributes: Attribute[] | null | undefined, config: KeyFactConfig[], language: string): string {
  return config
    .map((c) => fact(attributes ?? [], c, language))
    .filter(Boolean)
    .join(" · ");
}
