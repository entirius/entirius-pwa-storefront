"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LinkDynamic } from "@/lib/link-dynamic";
import { make_client_access } from "@/API/access/api.client-access";
import { useCartStore } from "@/stores/cart.store";

export function CheckoutSuccessClient() {
  const params = useSearchParams();
  const refs = params.getAll("ref");
  const payment_failed = params.get("payment") === "failed";
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
      <h1 className="mb-3 text-2xl">Order placed</h1>
      <p className="text-muted-foreground mb-6">
        {refs.length > 1
          ? `Thank you! Your order was split into ${refs.length} orders: ${refs.join(", ")}.`
          : `Thank you! Your order has been placed${refs[0] ? ` (ref ${refs[0]})` : ""}.`}
      </p>
      {payment_failed && (
        <p className="mb-6 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          We couldn’t start the payment. Your order is saved — please contact us
          with the order number to complete it.
        </p>
      )}
      <Button asChild variant="outline">
        <LinkDynamic href="/">Continue shopping</LinkDynamic>
      </Button>
    </div>
  );
}
