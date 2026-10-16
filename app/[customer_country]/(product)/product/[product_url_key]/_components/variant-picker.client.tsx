// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import { useId } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { RadioGroup } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n.provider";
import type { Price } from "@/utils/NORMALIZERS/price.normalizer";
import type { VariantAxis } from "@/utils/NORMALIZERS/variant.normalizer";
import { ProductPrice } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/product-price.client";

type PickerProps = {
  axes: VariantAxis[];
  selection: Record<string, string>;
  choose: (axis: string, value: string) => void;
  is_available: (axis: string, value: string) => boolean;
};

// One radio group per axis; each option is a radio styled as a chip. Arrow keys move inside a group, Tab moves
// between groups. Selected = 2px frame in the text colour, no fill (the CTA stays the only filled control);
// unavailable = muted and struck through, announced as unavailable, still readable.
export function VariantPicker({ axes, selection, choose, is_available }: PickerProps) {
  const { t } = useI18n();
  const id = useId();

  return (
    <div className="flex flex-col gap-4">
      {axes.map((axis) => {
        const label_id = `${id}-${axis.idx}`;
        const chosen = axis.options.find((o) => o.value === selection[axis.idx]);
        return (
          <div key={axis.idx} className="flex flex-col gap-2">
            <p id={label_id} className="text-xs font-medium text-foreground">
              {axis.label}
              {chosen && <span className="ml-2 font-normal text-muted-foreground">{chosen.label}</span>}
            </p>
            <RadioGroup
              aria-labelledby={label_id}
              value={chosen?.value ?? ""}
              onValueChange={(value) => choose(axis.idx, value)}
              className="flex flex-wrap gap-2"
            >
              {axis.options.map((option) => {
                const selected = option.value === chosen?.value;
                const available = is_available(axis.idx, option.value);
                return (
                  <RadioGroupPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={!available && !selected}
                    className={cn(
                      "relative touch-target inline-flex h-9 min-w-12 cursor-pointer items-center justify-center rounded-control border border-field-border bg-background px-3 text-xs transition-[color,box-shadow] outline-none hover:border-input sm:text-sm",
                      "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      "data-[state=checked]:border-foreground data-[state=checked]:font-medium data-[state=checked]:ring-1 data-[state=checked]:ring-inset data-[state=checked]:ring-foreground",
                      !available && "text-muted-foreground line-through disabled:cursor-not-allowed",
                    )}
                  >
                    {option.label}
                    {!available && <span className="sr-only">{t("product.option_unavailable")}</span>}
                  </RadioGroupPrimitive.Item>
                );
              })}
            </RadioGroup>
          </div>
        );
      })}
    </div>
  );
}

// The product price until a variant is chosen ("from <lowest>" when variants differ), then the variant's.
export function VariantPrice({
  price,
  from,
  large = false,
}: {
  price: Price | null;
  from: boolean;
  large?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-baseline gap-1.5">
      {from && <span className="text-sm text-muted-foreground">{t("product.price_from")}</span>}
      <ProductPrice price={price} large={large} />
    </div>
  );
}
