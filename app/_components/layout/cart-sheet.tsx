// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartStore } from "@/stores/cart.store";
import { CartItems } from "./cart-items";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function CartSheet() {
  const count = useCartStore((s) => s.count());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative cursor-pointer text-foreground"
          // The count joins the name only after mount, like the badge (no hydration mismatch).
          aria-label={
            mounted && count > 0
              ? `Cart, ${count} ${count === 1 ? "item" : "items"}`
              : "Cart"
          }
        >
          <ShoppingBag />
          {!mounted ? (
            <Spinner className="absolute -top-1 -right-1 size-3" />
          ) : count > 0 ? (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {count}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Cart</SheetTitle>
        </SheetHeader>
        <CartItems />
      </SheetContent>
    </Sheet>
  );
}
