// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState, useTransition } from "react";
import { DiscountCode as DiscountCodeView } from "@theme/forms/discount-code";
import type { Cart } from "@/utils/NORMALIZERS/cart.normalizer";
import { kept_discounts } from "@/utils/cart-discounts";
import { useDiscountsPatch } from "@/app/_components/order/use-cart-gifts";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

// Manual discount codes on the backend cart. PATCH replaces the whole set of
// manual codes, so applying sends the codes already on the cart plus the new
// one. An unusable code is not an HTTP error: the cart comes back without it and
// with a generic `_errors` entry, so the form compares what it sent with what
// stuck. Codes survive item changes; automatic rules are the backend's business.
// A picked gift is a code too (with its SKU): it is sent along and not listed here. The look is the theme's
// (@theme/forms/discount-code).
export function DiscountCode({ backend }: { backend: Cart | null | undefined }) {
  const { t } = useI18n();
  const patch = useDiscountsPatch();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const kept = kept_discounts(backend);
  const gift_codes = kept.filter((d) => d.sku);
  const applied = kept.filter((d) => !d.sku).map((d) => d.code);

  const save = (codes: string[], added?: string) => {
    setMessage(null);
    startTransition(async () => {
      const { error, cart } = await patch([...codes.map((code) => ({ code })), ...gift_codes]);
      if (error != null || !cart) {
        setMessage(error || t("cart.discount_failed"));
        return;
      }
      const gift_lost = gift_codes.some(
        (g) => !cart.discounts.some((d) => d.code === g.code && d.gratis_sku === g.sku && d.status === "valid"),
      );
      if (added) {
        const ok = cart.discounts.some((d) => d.code === added && d.status === "valid");
        if (!ok) setMessage(t("cart.discount_invalid"));
        else {
          setValue("");
          if (gift_lost) setMessage(t("cart.gift_removed_by_code"));
        }
      }
    });
  };

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const code = value.trim();
    if (!code || !backend?.cart_id) return;
    if (applied.includes(code)) {
      setValue("");
      return;
    }
    save([...applied, code], code);
  };

  return (
    <DiscountCodeView
      value={value}
      set_value={setValue}
      apply={apply}
      can_apply={!!value.trim() && !!backend?.cart_id}
      pending={pending}
      message={message}
      applied={applied.map((code) => ({ code, remove: () => save(applied.filter((c) => c !== code)) }))}
    />
  );
}
