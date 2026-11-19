// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Trash2 } from "lucide-react";
import type { CartLineModel } from "@entirius/storefront-sdk/cart/page";
import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";
import { QuantityStepper } from "@theme/ui/quantity-stepper";
import { ProductThumb } from "@theme/components/product-thumb";
import { UnitPrice } from "@theme/order/unit-price";

// One line: picture, then name / unit price / availability with the line total on the right, and quantity +
// remove under them. The total keeps one column, so amounts line up across lines.
export function CartLine({ line }: { line: CartLineModel }) {
  const { t } = useI18n();

  return (
    <li className="flex gap-4 py-4">
      <Link href={line.href} className="shrink-0 self-start" tabIndex={-1} aria-hidden>
        <ProductThumb src={line.picture} alt="" sizes="(min-width: 768px) 96px, 80px" className="w-20 md:w-24" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <Link href={line.href} className="text-base font-medium leading-snug text-heading hover:underline">
              {line.name}
            </Link>
            {line.unit && <UnitPrice price={line.unit} className="text-sm text-muted-foreground" />}
            {line.problem && (
              <p className="text-xs text-destructive">
                {line.problem === "out_of_stock" ? t("product.out_of_stock") : t("cart.limited")}
              </p>
            )}
          </div>
          <span className="shrink-0 text-right text-base font-medium tabular-nums">{line.total}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <QuantityStepper value={line.quantity} onChange={line.set_quantity} min={0} max={line.max} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="relative touch-target text-muted-foreground"
            aria-label={t("cart.remove", { name: line.name })}
            onClick={line.remove}
          >
            <Trash2 aria-hidden />
            <span className="hidden md:inline">{t("cart.remove_short")}</span>
          </Button>
        </div>
      </div>
    </li>
  );
}
