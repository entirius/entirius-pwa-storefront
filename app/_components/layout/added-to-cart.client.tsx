// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/ui/media-image.client";
import { LinkDynamic } from "@/lib/link-dynamic";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { useAddedToCart } from "@/stores/added-to-cart.store";
import { useCartStore } from "@/stores/cart.store";

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
      className="pointer-events-none fixed inset-x-4 top-20 z-40 flex justify-end sm:left-auto sm:w-96"
    >
      {item && (
        <div className="pointer-events-auto flex w-full flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-glow">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-positive-surface text-positive">
              <Check className="size-4" aria-hidden />
            </span>
            <p className="flex-1 font-semibold text-heading">Added to your cart</p>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Close" onClick={hide}>
              <X />
            </Button>
          </div>
          <div className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-3">
            <div className="relative size-16 overflow-hidden rounded-2xl bg-muted">
              <MediaImage src={item.image ?? image_placeholder} alt="" fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-brand text-heading">{item.name}</p>
              <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
            </div>
            {item.price && <span className="font-brand text-heading">{item.price}</span>}
          </div>
          <p className="border-t border-border pt-3 text-sm text-muted-foreground">
            Cart: {count} {count === 1 ? "item" : "items"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="rounded-full" asChild>
              <LinkDynamic href="/cart" onClick={hide}>
                View cart
              </LinkDynamic>
            </Button>
            <Button className="rounded-full" asChild>
              <LinkDynamic href="/checkout" onClick={hide}>
                Checkout
              </LinkDynamic>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
