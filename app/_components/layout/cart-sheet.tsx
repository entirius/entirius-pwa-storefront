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
import { useI18n } from "@/providers/i18n.provider";

export function CartSheet() {
  const { t } = useI18n();
  const count = useCartStore((s) => s.count());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("header.cart")} className="relative cursor-pointer text-foreground">
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
          <SheetTitle>{t("cart.title")}</SheetTitle>
        </SheetHeader>
        <CartItems />
      </SheetContent>
    </Sheet>
  );
}
