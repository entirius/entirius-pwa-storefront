"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useWishlistStore } from "@/stores/wishlist.store";
import { WishlistItems } from "./wishlist-items";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function WishlistSheet() {
  const count = useWishlistStore((s) => s.count());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative cursor-pointer text-foreground">
          <Heart />
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
          <SheetTitle>Wishlist</SheetTitle>
        </SheetHeader>
        <WishlistItems />
      </SheetContent>
    </Sheet>
  );
}
