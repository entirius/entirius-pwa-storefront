"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LinkDynamic } from "@/lib/link-dynamic";
import { make_client_access } from "@/API/access/api.client-access";
import { useCartStore } from "@/stores/cart.store";
import { useI18n } from "@/providers/i18n.provider";

export function CheckoutSuccessClient() {
  const { t } = useI18n();
  const ref = useSearchParams().get("ref");
  const torn_down = useRef(false);

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
      <h1 className="mb-3 text-2xl font-bold">{t("checkout.success_title")}</h1>
      <p className="text-muted-foreground mb-6">
        {ref ? t("checkout.success_ref", { ref }) : t("checkout.success_text")}
      </p>
      <Button asChild variant="outline">
        <LinkDynamic href="/">{t("common.continue_shopping")}</LinkDynamic>
      </Button>
    </div>
  );
}
