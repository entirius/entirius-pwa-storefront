// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useId } from "react";
import { X } from "lucide-react";
import type { DiscountCodeModel } from "@entirius/storefront-sdk/forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { Field, FormError } from "@theme/ui/form";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@theme/ui/input-group";
import { Spinner } from "@theme/ui/spinner";

// The discount code in the cart and checkout summaries: the field with its button, the applied codes to remove.
export function DiscountCode({ value, set_value, apply, can_apply, pending, message, applied }: DiscountCodeModel) {
  const { t } = useI18n();
  const input_id = useId();
  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={apply}>
        <Field id={input_id} label={t("cart.discount_code")}>
          <InputGroup>
            <InputGroupInput id={input_id} value={value} onChange={(e) => set_value(e.target.value)} autoComplete="off" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" size="sm" className="font-medium" disabled={pending || !can_apply}>
                {pending ? <Spinner className="size-4" /> : t("cart.discount_apply")}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </form>
      <FormError>{message}</FormError>
      {applied.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("cart.discount_applied")}>
          {applied.map(({ code, remove }) => (
            <li key={code} className="flex items-center gap-1 rounded-md bg-positive-surface py-0.5 pr-0.5 pl-2 text-xs text-positive">
              {code}
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                aria-label={t("cart.discount_remove", { code })}
                className="rounded p-0.5 hover:bg-positive/20"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
