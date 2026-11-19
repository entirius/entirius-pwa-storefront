// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@theme/lib/utils";
import { Button, buttonVariants } from "@theme/ui/button";
import type { WishlistItem } from "@entirius/storefront-sdk/product";
import { useWishlist } from "@entirius/storefront-sdk/storefront";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

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
        true: "fill-highlight text-highlight",
        false: "fill-transparent text-current group-hover:text-highlight",
      },
      variant: {
        default: "group-hover:text-highlight",
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
    const { t } = useI18n();
    const wishlist = useWishlist(sku, item);
    const isActive = wishlist.mounted ? (sku ? wishlist.active : isActiveProp) : false;

    const isIconOnly = size === "icon" || size === "icon-sm" || size === "icon-lg" || size === "icon-xs";

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      wishlist.toggle();
      onClick?.(e);
    };

    return (
      <Button
        ref={ref}
        data-active={isActive}
        aria-label={ariaLabel ?? (isActive ? t("wishlist.remove") : t("wishlist.add"))}
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
          <span>{label ?? (isActive ? t("wishlist.saved") : t("wishlist.save"))}</span>
        )}
      </Button>
    );
  }
);

WishlistButton.displayName = "WishlistButton";

export { WishlistButton };
