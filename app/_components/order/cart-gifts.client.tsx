// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useId } from "react";
import { Gift, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormError, FormHeading } from "@/components/ui/form";
import { ProductThumb } from "@/components/ui/product-thumb";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { price_lines } from "@/lib/i18n/price-lines";
import { LinkDynamic } from "@/lib/link-dynamic";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n.provider";
import type { Cart, CartLine, GratisRule } from "@/utils/NORMALIZERS/cart.normalizer";
import type { GiftProduct, GiftSetter } from "@/app/_components/order/use-cart-gifts";

const num = (v: string | null | undefined) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

// The gift price: "Free" at zero, else the amount.
function useGiftPrice(currency: string) {
  const i18n = useI18n();
  return (amount: string | null | undefined) =>
    amount != null && num(amount) === 0 ? i18n.t("common.free") : i18n.price(amount, currency);
}

export function GiftBadge() {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1 self-start rounded bg-positive-surface px-1.5 py-0.5 text-xs font-medium text-positive">
      <Gift aria-hidden className="size-3" />
      {t("cart.gift_badge")}
    </span>
  );
}

// The rule a gift line was picked through, and how many pieces it allows now.
export function gift_rule(backend: Cart | null | undefined, rules: GratisRule[], sku: string) {
  const code = backend?.discounts.find((d) => d.gratis_sku === sku)?.code;
  return { code, rule: rules.find((r) => r.code === code) };
}

// A gift line of the cart page, laid out like the other lines: the struck list price and the gift price, a
// quantity up to what the rule allows, and remove (which drops the gift, not a product).
export function GiftLine({
  line,
  product,
  code,
  max,
  currency,
  gifts,
}: {
  line: CartLine;
  product: GiftProduct | undefined;
  code: string | undefined;
  max: number;
  currency: string;
  gifts: GiftSetter;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const gift_price = useGiftPrice(currency);
  const name = product?.name ?? line.sku;
  const href = product ? `/product/${product.url_key}` : undefined;
  const thumb = (
    <ProductThumb src={product?.media?.[0]?.[0]?.uri} alt="" sizes="(min-width: 768px) 96px, 80px" className="w-20 md:w-24" />
  );

  return (
    <li className="flex gap-4 py-4">
      {href ? (
        <LinkDynamic href={href} className="shrink-0 self-start" tabIndex={-1} aria-hidden>
          {thumb}
        </LinkDynamic>
      ) : (
        thumb
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            {href ? (
              <LinkDynamic href={href} className="text-base font-medium leading-snug text-heading hover:underline">
                {name}
              </LinkDynamic>
            ) : (
              <span className="text-base font-medium leading-snug text-heading">{name}</span>
            )}
            <span className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              {line.unit_gross && line.unit_gross !== line.final_unit_gross && (
                <s className="text-muted-foreground/70">{i18n.price(line.unit_gross, currency)}</s>
              )}
              <span>{gift_price(line.final_unit_gross)}</span>
            </span>
            <GiftBadge />
          </div>
          <span className="shrink-0 text-right text-base font-medium tabular-nums">
            {gift_price(line.final_total_gross)}
          </span>
        </div>
        {code && (
          <div className="flex items-center justify-between gap-2">
            <QuantityStepper
              value={line.quantity}
              onChange={(q) => gifts.set_gift(code, line.sku, q)}
              min={0}
              max={Math.max(max, line.quantity)}
              disabled={gifts.pending}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="relative touch-target text-muted-foreground"
              aria-label={t("cart.remove", { name })}
              onClick={() => gifts.set_gift(code, line.sku, 0)}
              disabled={gifts.pending}
            >
              <Trash2 aria-hidden />
              <span className="hidden md:inline">{t("cart.remove_short")}</span>
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

// A gift line of the checkout summary: read-only, like the other summary lines.
export function GiftSummaryLine({
  line,
  product,
  currency,
}: {
  line: CartLine;
  product: GiftProduct | undefined;
  currency: string;
}) {
  const { t } = useI18n();
  const gift_price = useGiftPrice(currency);
  const name = product?.name ?? line.sku;
  return (
    <div className="flex gap-3 py-3">
      <ProductThumb src={product?.media?.[0]?.[0]?.uri} alt={name} sizes="64px" className="w-16" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{t("checkout.quantity", { count: line.quantity })}</span>
          <span>{gift_price(line.final_unit_gross)}</span>
        </div>
        <GiftBadge />
      </div>
      <span className="text-sm font-medium tabular-nums">{gift_price(line.final_total_gross)}</span>
    </div>
  );
}

// Under the cart lines: how much is missing to the next gift tier, and the gifts to pick from. Nothing when
// the cart has no gratis rule in reach.
export function GiftCard({
  backend,
  rules,
  products,
  gifts,
}: {
  backend: Cart | null | undefined;
  rules: GratisRule[];
  products: Record<string, GiftProduct>;
  gifts: GiftSetter;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const heading_id = useId();
  const currency = backend?.currency || "";
  const missing = backend?.gratis.amount_missing;
  const nearest = backend?.gratis.nearest_tier_price;
  const in_reach = num(missing) > 0 && num(nearest) > 0;
  const offers = rules.filter((r) => r.max_quantity > 0 && r.items.length > 0);
  if (!in_reach && offers.length === 0) return null;

  const next_quantity = offers.find((r) => r.next_tier_quantity)?.next_tier_quantity;
  const amount = i18n.price(missing, currency);
  const away = !in_reach
    ? null
    : next_quantity
      ? t("cart.gift_next_tier", { amount, count: next_quantity })
      : t("cart.gift_away", { amount });
  const progress = in_reach ? Math.round(((num(nearest) - num(missing)) / num(nearest)) * 100) : 100;
  // A gift the cart dropped on the last change (its total fell under the gift's tier).
  const removed =
    !backend?.gifts.length && !!backend?.errors.some((e) => offers.some((r) => r.code === e.discount_code));

  return (
    <section aria-labelledby={heading_id} className="surface-outline flex flex-col gap-4">
      <FormHeading id={heading_id} className="flex items-center gap-2">
        <Gift aria-hidden className="size-5" />
        {t("cart.gift_title")}
      </FormHeading>
      {away && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{away}</p>
          <div aria-hidden className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-positive" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {removed && <p className="text-sm text-muted-foreground">{t("cart.gift_removed")}</p>}
      {offers.map((rule) => (
        <GiftOptions key={rule.code} rule={rule} backend={backend} products={products} gifts={gifts} />
      ))}
      <FormError>{gifts.failed ? t("cart.gift_failed") : null}</FormError>
    </section>
  );
}

// The gifts of one rule as radio options. Picking keeps the quantity already chosen (1 the first time).
function GiftOptions({
  rule,
  backend,
  products,
  gifts,
}: {
  rule: GratisRule;
  backend: Cart | null | undefined;
  products: Record<string, GiftProduct>;
  gifts: GiftSetter;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const label_id = useId();
  const gift_price = useGiftPrice(backend?.currency || "");
  const picked = backend?.discounts.find((d) => d.code === rule.code && d.gratis_sku);
  const quantity = Math.min(picked?.gratis_quantity ?? 1, rule.max_quantity);

  return (
    <div className="flex flex-col gap-2">
      <p id={label_id} className="text-sm text-muted-foreground">
        {t("cart.gift_choose", { count: rule.max_quantity })}
      </p>
      <RadioGroup
        aria-labelledby={label_id}
        value={picked?.gratis_sku ?? ""}
        onValueChange={(sku) => gifts.set_gift(rule.code, sku, quantity)}
        disabled={gifts.pending}
        className="gap-2"
      >
        {rule.items.map((item) => {
          const product = products[item.sku];
          const active = picked?.gratis_sku === item.sku;
          const list_price = product ? price_lines(i18n, product.price).at(-1) : undefined;
          return (
            <label
              key={item.sku}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                active ? "border-primary bg-primary/5" : "hover:bg-muted/50",
              )}
            >
              <RadioGroupItem value={item.sku} />
              <ProductThumb src={product?.media?.[0]?.[0]?.uri} alt="" sizes="48px" className="w-12" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium">{product?.name ?? item.sku}</span>
                <span className="flex flex-wrap items-center gap-1.5 text-xs">
                  {list_price && product?.price && <s className="text-muted-foreground/70">{list_price}</s>}
                  <span className="font-medium text-positive">{gift_price(item.price)}</span>
                </span>
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
