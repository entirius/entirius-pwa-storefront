"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { useWishlistStore } from "@/stores/wishlist.store";

// ─── variants ────────────────────────────────────────────────────────────────

const heartVariants = cva(
  "transition-[fill,color] duration-150 pointer-events-none shrink-0",
  {
    variants: {
      size: {
        icon: "size-4",
        "icon-xs": "size-3",
        "icon-sm": "size-3.5",
        "icon-lg": "size-5",
        xs: "size-3",
        sm: "size-3.5",
        default: "size-4",
        lg: "size-5",
      },
      isActive: {
        true: "fill-red-500 text-red-500",
        false: "fill-transparent text-current group-hover:text-red-400",
      },
      variant: {
        default: "group-hover:text-red-300",
        destructive: "",
        outline: "",
        secondary: "",
        ghost: "",
        link: "",
      },
    },
    defaultVariants: {
      size: "icon",
      isActive: false,
      variant: "ghost",
    },
  }
);

// ─── types ───────────────────────────────────────────────────────────────────

type WishlistItem = {
  sku: string;
  name: string;
  url_key: string;
  price: any;
  description: string;
  media: { uri: string; width: number; height: number }[][];
};

export interface WishlistButtonProps
  extends Omit<React.ComponentProps<"button">, "children">,
    VariantProps<typeof buttonVariants> {
  sku?: string;
  item?: WishlistItem;
  isActive?: boolean;
  label?: string;
}

// ─── component ───────────────────────────────────────────────────────────────

const WishlistButton = React.forwardRef<HTMLButtonElement, WishlistButtonProps>(
  (
    {
      className,
      variant = "ghost",
      size = "icon",
      sku,
      item,
      isActive: isActiveProp = false,
      label,
      onClick,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const storeActive = useWishlistStore((s) => (sku ? s.has(sku) : false));
    const toggle = useWishlistStore((s) => s.toggle);
    const isActive = mounted ? (sku ? storeActive : isActiveProp) : false;

    const isIconOnly = size === "icon" || size === "icon-sm" || size === "icon-lg" || size === "icon-xs";

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (sku && item) toggle(sku, item);
      onClick?.(e);
    };

    return (
      <Button
        ref={ref}
        data-active={isActive}
        aria-label={ariaLabel ?? (isActive ? "Remove from wishlist" : "Add to wishlist")}
        aria-pressed={isActive}
        variant={variant ?? "ghost"}
        size={size ?? "icon"}
        className={cn("group cursor-pointer", className)}
        onClick={handleClick}
        {...props}
      >
        <Heart
          className={cn(
            heartVariants({ size, isActive, variant })
          )}
        />
        {!isIconOnly && (
          <span>{label ?? (isActive ? "Saved" : "Save")}</span>
        )}
      </Button>
    );
  }
);

export { WishlistButton };
