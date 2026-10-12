// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  size = "sm",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
  // `lg`: one pill matching a large button (product page); `sm`: compact (cart).
  size?: "sm" | "lg";
  className?: string;
}) {
  const clamp = (n: number) => Math.min(Math.max(n, min), max);
  const large = size === "lg";

  return (
    <div
      className={cn(
        "flex items-center",
        large ? "h-10 rounded-full border border-border bg-card" : "gap-1",
        className,
      )}
    >
      <Button
        type="button"
        variant={large ? "ghost" : "outline"}
        size={large ? "icon-lg" : "icon-sm"}
        className={cn(large && "rounded-full")}
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        <Minus />
      </Button>
      <span
        aria-live="polite"
        className={cn("min-w-8 text-center tabular-nums", large ? "font-semibold" : "text-sm")}
      >
        {value}
      </span>
      <Button
        type="button"
        variant={large ? "ghost" : "outline"}
        size={large ? "icon-lg" : "icon-sm"}
        className={cn(large && "rounded-full")}
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        <Plus />
      </Button>
    </div>
  );
}
