// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { useProductPage } from "@entirius/storefront-sdk/product/page";
import { cn } from "@theme/lib/utils";
import { Button } from "@theme/ui/button";
import { ProductPrice } from "@theme/components/product-price";

// Height of the sticky site header (h-16 plus its border).
const HEADER_HEIGHT = 65;

// Phone-only bar fixed to the bottom edge. It slides in once `target` (the primary action) is out of view and
// stays away while the cookie banner is open (the library marks <html class="show--consent">).
function StickyBuyBar({ target, children }: { target: RefObject<HTMLElement | null>; children: ReactNode }) {
  const [away, setAway] = useState(false);
  const [consent_open, setConsentOpen] = useState(false);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    // The sticky header covers the top of the viewport: a target behind it counts as out of view.
    const observer = new IntersectionObserver(([entry]) => setAway(!entry.isIntersecting), {
      rootMargin: `-${HEADER_HEIGHT}px 0px 0px 0px`,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setConsentOpen(root.classList.contains("show--consent"));
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const shown = away && !consent_open;
  return (
    <div
        data-buy-bar
        data-shown={shown ? "" : undefined}
        inert={!shown}
        className={cn(
          "fixed inset-x-0 bottom-0 z-sticky flex items-center gap-3 border-t border-border bg-background px-4 pt-2 md:hidden",
          "pb-[max(0.5rem,env(safe-area-inset-bottom))] motion-safe:transition-transform motion-safe:duration-200",
          shown ? "translate-y-0" : "translate-y-full",
        )}
      >
        {children}
    </div>
  );
}

// Phones: the price and the main action at the bottom of the screen once the buy area has scrolled away.
export function ProductStickyBuyBar() {
  const { t } = useI18n();
  const page = useProductPage();
  const { buy, stock, notify_similar } = page;
  if (!page.purchasable) return null;

  const alert = buy.mode === "stock_alert";
  const alert_trigger = (
    <Button className="min-w-0 flex-1" data-stock-alert-trigger onClick={page.scroll_to_buy_area}>
      {t("stockAlert.short")}
    </Button>
  );

  return (
    <StickyBuyBar target={page.buy_area}>
      {!stock.sold_out && <ProductPrice price={page.price.value} />}
      {stock.sold_out ? (
        <>
          {/* With the notify action the bar has room for two buttons only: the marker stays in the buy area. */}
          {!notify_similar.visible && !alert && (
            <span data-unavailable className="text-sm font-medium">{t("product.out_of_stock")}</span>
          )}
          <Button
            asChild
            variant="outline"
            className={cn(
              "hidden group-has-[[data-related-products]]/product:inline-flex",
              notify_similar.visible || alert ? "shrink-0" : "ml-auto",
            )}
          >
            <Link href="#related-products">{t("product.see_similar")}</Link>
          </Button>
          {notify_similar.visible && (
            <Button className="min-w-0 flex-1" data-notify-bar-trigger onClick={notify_similar.open}>
              {t("product.notify_short")}
            </Button>
          )}
          {alert && alert_trigger}
        </>
      ) : alert ? (
        alert_trigger
      ) : (
        <Button className="ml-auto flex-1" disabled={!buy.can_buy} onClick={buy.add_to_cart}>
          {buy.label}
        </Button>
      )}
    </StickyBuyBar>
  );
}
