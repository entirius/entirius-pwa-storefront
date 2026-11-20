// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useId } from "react";
import { Gift } from "lucide-react";
import type { GiftPickerModel } from "@entirius/storefront-sdk/cart";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";
import { FormError, FormHeading } from "@theme/ui/form";
import { RadioGroup, RadioGroupItem } from "@theme/ui/radio-group";
import { ProductThumb } from "@theme/components/product-thumb";

// Under the cart lines: how much is missing to the next gift tier, and each rule's gifts to pick from.
export function GiftPicker({ picker }: { picker: GiftPickerModel }) {
  const { t } = useI18n();
  const heading_id = useId();
  return (
    <section aria-labelledby={heading_id} className="surface-outline flex flex-col gap-4">
      <FormHeading id={heading_id} className="flex items-center gap-2">
        <Gift aria-hidden className="size-5" />
        {t("cart.gift_title")}
      </FormHeading>
      {picker.away && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{picker.away}</p>
          <div aria-hidden className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-positive" style={{ width: `${picker.progress}%` }} />
          </div>
        </div>
      )}
      {picker.removed && <p className="text-sm text-muted-foreground">{t("cart.gift_removed")}</p>}
      {picker.offers.map((offer) => (
        <GiftOffer key={offer.code} offer={offer} />
      ))}
      <FormError>{picker.failed ? t("cart.gift_failed") : null}</FormError>
    </section>
  );
}

// One rule's gifts as radio options.
function GiftOffer({ offer }: { offer: GiftPickerModel["offers"][number] }) {
  const { t } = useI18n();
  const label_id = useId();
  return (
    <div className="flex flex-col gap-2">
      <p id={label_id} className="text-sm text-muted-foreground">
        {t("cart.gift_choose", { count: offer.max })}
      </p>
      <RadioGroup aria-labelledby={label_id} value={offer.picked} onValueChange={offer.choose} disabled={offer.pending} className="gap-2">
        {offer.items.map((item) => (
          <label
            key={item.sku}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
              offer.picked === item.sku ? "border-primary bg-primary/5" : "hover:bg-muted/50",
            )}
          >
            <RadioGroupItem value={item.sku} />
            <ProductThumb src={item.picture} alt="" sizes="48px" className="w-12" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium">{item.name}</span>
              <span className="flex flex-wrap items-center gap-1.5 text-xs">
                {item.regular && <s className="text-muted-foreground/70">{item.regular}</s>}
                <span className="font-medium text-positive">{item.price}</span>
              </span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
