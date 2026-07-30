import { cn } from "@/lib/utils";
import type { CartLine } from "@/utils/NORMALIZERS/cart.normalizer";

// Per-unit price. When a special/sale price applies, strikes the list price and
// accents the charged price + a "−N%" badge. Shared by the drawer and checkout so
// the "changed price" reads the same in both.
export function UnitPrice({
  line,
  currency,
  className,
}: {
  line: CartLine | undefined;
  currency: string;
  className?: string;
}) {
  if (!line?.final_unit_gross) return null;
  const cur = currency ? ` ${currency}` : "";
  const on_sale =
    line.has_special_price &&
    !!line.unit_gross &&
    line.unit_gross !== line.final_unit_gross;

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {on_sale && (
        <s className="text-muted-foreground/70">
          {line.unit_gross}
          {cur}
        </s>
      )}
      <span className={on_sale ? "font-medium text-destructive" : undefined}>
        {line.final_unit_gross}
        {cur}
      </span>
      {on_sale && line.percent_off ? (
        <span className="rounded bg-destructive/10 px-1 text-[10px] font-semibold text-destructive">
          −{line.percent_off}%
        </span>
      ) : null}
    </span>
  );
}
