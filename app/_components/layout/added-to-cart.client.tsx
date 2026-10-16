// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/components/ui/product-thumb";
import { LinkDynamic } from "@/lib/link-dynamic";
import { useAddedToCart } from "@/stores/added-to-cart.store";
import { useCartStore } from "@/stores/cart.store";
import { price_lines } from "@/lib/i18n/price-lines";
import { useI18n } from "@/providers/i18n.provider";

const VISIBLE_MS = 6000;

// "Added to your cart" under the header after Add to cart / "+": the product,
// the cart count, View cart and Checkout. Closes itself, on Close, or when the
// visitor moves to another page.
export function AddedToCart() {
  const item = useAddedToCart((s) => s.item);
  const key = useAddedToCart((s) => s.key);
  const hide = useAddedToCart((s) => s.hide);
  const count = useCartStore((s) => s.count());

  // Leaving the page (the cart link, a product, checkout) dismisses it.
  const i18n = useI18n();
  const pathname = usePathname();
  const shown_on = useRef(pathname);
  useEffect(() => {
    if (pathname !== shown_on.current) {
      shown_on.current = pathname;
      hide();
    }
  }, [pathname, hide]);

  useEffect(() => {
    if (!item) return;
    const t = setTimeout(hide, VISIBLE_MS);
    return () => clearTimeout(t);
  }, [item, key, hide]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-20 z-toast flex justify-end sm:left-auto sm:w-96"
    >
      {item && (
        <div className="pointer-events-auto flex w-full flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-glow">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-positive-surface text-positive">
              <Check className="size-4" aria-hidden />
            </span>
            <p className="flex-1 font-semibold text-heading">{i18n.t("cart.added")}</p>
            <Button variant="ghost" size="icon" aria-label={i18n.t("common.close")} onClick={hide}>
              <X />
            </Button>
          </div>
          <div className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-3">
            <ProductThumb src={item.image} alt="" sizes="64px" className="w-16" />
            <div className="min-w-0">
              <p className="line-clamp-2 font-brand leading-snug text-heading">{item.name}</p>
              {item.options?.map((o) => (
                <p key={o.axis} className="text-sm text-muted-foreground">
                  {o.axis}: {o.value}
                </p>
              ))}
              <p className="text-sm text-muted-foreground">{i18n.t("checkout.quantity", { count: item.quantity })}</p>
            </div>
            {item.price && (
              <span className="font-brand text-heading">{price_lines(i18n, item.price).at(-1)}</span>
            )}
          </div>
          <p className="border-t border-border pt-3 text-sm text-muted-foreground">
            {i18n.t("cart.added_count", { count })}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" asChild>
              <LinkDynamic href="/cart" onClick={hide}>
                {i18n.t("cart.view")}
              </LinkDynamic>
            </Button>
            <Button asChild>
              <LinkDynamic href="/checkout" onClick={hide}>
                {i18n.t("cart.checkout")}
              </LinkDynamic>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
