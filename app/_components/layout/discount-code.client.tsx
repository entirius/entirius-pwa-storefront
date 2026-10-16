// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import { API_CART_DISCOUNTS_ROUTE } from "@/API/api.routes";
import { NORM_CART, type Cart } from "@/utils/NORMALIZERS/cart.normalizer";
import { FormError } from "@/components/ui/form";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/providers/i18n.provider";

// Manual discount codes on the backend cart. PATCH replaces the whole set of
// manual codes, so applying sends the codes already on the cart plus the new
// one. An unusable code is not an HTTP error: the cart comes back without it and
// with a generic `_errors` entry, so the form compares what it sent with what
// stuck. Codes survive item changes; automatic rules are the backend's business.
export function DiscountCode({ backend }: { backend: Cart | null | undefined }) {
  const { t } = useI18n();
  const api = useMemo(() => create_api(make_client_access()), []);
  const query_client = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const applied = (backend?.discounts ?? [])
    .filter((d) => !d.is_automatic && d.status === "valid" && d.code)
    .map((d) => d.code);

  const save = (codes: string[], added?: string) => {
    setMessage(null);
    startTransition(async () => {
      const body = codes.length
        ? { codes: codes.map((code) => ({ code })) }
        : { clear: true };
      const [error, response] = await api.FETCH_METHOD(API_CART_DISCOUNTS_ROUTE, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (error) {
        setMessage(error.message || t("cart.discount_failed"));
        return;
      }
      const cart = NORM_CART(response);
      // Every cart query (cart page, checkout) shows the same backend cart.
      query_client.setQueriesData({ queryKey: ["cart"] }, cart);
      if (added) {
        const ok = cart.discounts.some((d) => d.code === added && d.status === "valid");
        if (ok) setValue("");
        else setMessage(t("cart.discount_invalid"));
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
    <div className="flex flex-col gap-2">
      <form onSubmit={apply}>
        <InputGroup>
          <InputGroupInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("cart.discount_code")}
            aria-label={t("cart.discount_code")}
            autoComplete="off"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="submit"
              size="sm"
              className="font-medium"
              disabled={pending || !value.trim() || !backend?.cart_id}
            >
              {pending ? <Spinner className="size-4" /> : t("cart.discount_apply")}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
      <FormError>{message}</FormError>
      {applied.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("cart.discount_applied")}>
          {applied.map((code) => (
            <li
              key={code}
              className="flex items-center gap-1 rounded-md bg-positive-surface py-0.5 pr-0.5 pl-2 text-xs text-positive"
            >
              {code}
              <button
                type="button"
                onClick={() => save(applied.filter((c) => c !== code))}
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
