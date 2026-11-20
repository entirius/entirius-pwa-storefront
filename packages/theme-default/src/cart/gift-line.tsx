// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Trash2 } from "lucide-react";
import type { GiftLineModel } from "@entirius/storefront-sdk/cart";
import { Link } from "@entirius/storefront-sdk/components/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Button } from "@theme/ui/button";
import { QuantityStepper } from "@theme/ui/quantity-stepper";
import { ProductThumb } from "@theme/components/product-thumb";
import { GiftBadge } from "@theme/order/gift-badge";

// A gift line of the cart page (a list item), laid out like the other lines: the struck list price and the gift
// price, a quantity up to what the rule allows, and remove (which drops the gift, not a product).
export function GiftLine({ line }: { line: GiftLineModel }) {
  const { t } = useI18n();
  const thumb = <ProductThumb src={line.picture} alt="" sizes="(min-width: 768px) 96px, 80px" className="w-20 md:w-24" />;
  return (
    <li className="flex gap-4 py-4">
      {line.href ? (
        <Link href={line.href} className="shrink-0 self-start" tabIndex={-1} aria-hidden>
          {thumb}
        </Link>
      ) : (
        thumb
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            {line.href ? (
              <Link href={line.href} className="text-base font-medium leading-snug text-heading hover:underline">
                {line.name}
              </Link>
            ) : (
              <span className="text-base font-medium leading-snug text-heading">{line.name}</span>
            )}
            <span className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              {line.regular && <s className="text-muted-foreground/70">{line.regular}</s>}
              <span>{line.unit}</span>
            </span>
            <GiftBadge />
          </div>
          <span className="shrink-0 text-right text-base font-medium tabular-nums">{line.total}</span>
        </div>
        {line.edit && (
          <div className="flex items-center justify-between gap-2">
            <QuantityStepper
              value={line.quantity}
              onChange={line.edit.set_quantity}
              min={0}
              max={line.edit.max}
              disabled={line.edit.pending}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="relative touch-target text-muted-foreground"
              aria-label={t("cart.remove", { name: line.name })}
              onClick={line.edit.remove}
              disabled={line.edit.pending}
            >
              <Trash2 aria-hidden />
              <span className="hidden md:inline">{t("cart.remove_short")}</span>
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}
