// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Check, Plus } from "lucide-react";
import { Button } from "@theme/ui/button";
import { Spinner } from "@theme/ui/spinner";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { useQuickAdd, type QuickAddItem } from "./use-quick-add";

// "+" on a product card: one unit into the cart.
export function QuickAdd({ item }: { item: QuickAddItem }) {
  const { t } = useI18n();
  const { state, run } = useQuickAdd(item);

  const label =
    state === "none"
      ? t("catalog.quick_add_out_of_stock", { name: item.name })
      : state === "added"
        ? t("catalog.quick_add_added", { name: item.name })
        : t("catalog.quick_add", { name: item.name });

  return (
    <Button
      type="button"
      size="icon-lg"
      data-quick-add
      className="shrink-0 rounded-full"
      aria-label={label}
      disabled={state === "none"}
      onClick={run}
    >
      {state === "busy" ? (
        <Spinner className="size-4" />
      ) : state === "added" ? (
        <Check className="size-5" />
      ) : (
        <Plus className="size-5" />
      )}
    </Button>
  );
}
