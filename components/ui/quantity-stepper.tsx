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
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
  className?: string;
}) {
  const clamp = (n: number) => Math.min(Math.max(n, min), max);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        <Minus />
      </Button>
      <span
        aria-live="polite"
        className="min-w-8 text-center text-sm tabular-nums"
      >
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        <Plus />
      </Button>
    </div>
  );
}
