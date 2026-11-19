// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { memo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useSortCriterion, type SortCriterion } from "@entirius/storefront-sdk/catalog/listing";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";

const pill = (active: boolean) =>
  cn(
    "inline-flex h-8 pointer-coarse:min-h-touch cursor-pointer items-center gap-1 rounded-chip border px-3 text-xs font-medium transition-colors",
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-heading hover:bg-muted",
  );

// One criterion with its ascending and descending buttons; a second click on the active one turns it off.
const SortRow = memo(function SortRow({ criterion }: { criterion: SortCriterion }) {
  const { t } = useI18n();
  const { direction, toggle } = useSortCriterion(criterion.idx);
  const { label } = criterion;
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-sm text-heading">{label}</span>
      <button
        type="button"
        aria-pressed={direction === "ASC"}
        aria-label={t("catalog.sort_ascending", { label })}
        className={pill(direction === "ASC")}
        onClick={() => toggle("ASC")}
      >
        <ArrowUp className="size-3.5" aria-hidden />
        {t("catalog.asc")}
      </button>
      <button
        type="button"
        aria-pressed={direction === "DESC"}
        aria-label={t("catalog.sort_descending", { label })}
        className={pill(direction === "DESC")}
        onClick={() => toggle("DESC")}
      >
        <ArrowDown className="size-3.5" aria-hidden />
        {t("catalog.desc")}
      </button>
    </div>
  );
});

// Sorting: one criterion at a time, ascending or descending.
export function SortOptions({ criteria }: { criteria: SortCriterion[] }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base">{t("catalog.sort")}</h3>
      <div className="flex flex-col gap-2">
        {criteria.map((criterion) => (
          <SortRow key={criterion.idx} criterion={criterion} />
        ))}
      </div>
    </div>
  );
}
