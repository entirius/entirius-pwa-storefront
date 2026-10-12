// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LinkDynamic } from "@/lib/link-dynamic";
import { make_client_access } from "@/API/access/api.client-access";
import { useCartStore } from "@/stores/cart.store";
import { useI18n } from "@/providers/i18n.provider";

export function CheckoutSuccessClient() {
  const params = useSearchParams();
  const refs = params.getAll("ref");
  const payment_failed = params.get("payment") === "failed";
  const torn_down = useRef(false);
  const { t } = useI18n();

  // The order is placed — tear down the cart here (not before navigation) so the
  // checkout page never flashes its empty-cart state on the way out.
  useEffect(() => {
    if (torn_down.current) return;
    torn_down.current = true;
    useCartStore.getState().clear();
    make_client_access().delete?.("cid");
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="mb-3 text-2xl">{t("checkout.success_title")}</h1>
      <p className="text-muted-foreground mb-6">
        {refs.length > 1
          ? t("checkout.success_split", { count: refs.length, refs: refs.join(", ") })
          : refs[0]
            ? t("checkout.success_ref", { ref: refs[0] })
            : t("checkout.success_text")}
      </p>
      {payment_failed && (
        <p className="mb-6 rounded-md border border-destructive/50 bg-destructive-surface px-3 py-2 text-sm text-destructive">
          {t("checkout.payment_start_failed")}
        </p>
      )}
      <Button asChild variant="outline">
        <LinkDynamic href="/">{t("common.continue_shopping")}</LinkDynamic>
      </Button>
    </div>
  );
}
