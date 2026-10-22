// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import Link from "next/link";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLoading } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SanitizeHTML } from "@/components/ui/sanitize-html";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import { useCartStore } from "@/stores/cart.store";
import { useAddedToCart } from "@/stores/added-to-cart.store";
import { useI18n } from "@/providers/i18n.provider";
import { product_query } from "../api.query";
import { stock_query } from "../stock.query";
import { useProductVariants } from "./use-product-variants";
import { VariantPicker, VariantPrice } from "./variant-picker.client";
import { ProductPrice } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/product-price.client";
import { ProductSpecs } from "./product-specs";
import { ProductStories } from "./product-stories";
import { Gallery } from "./gallery.client";
import { scroll_behavior } from "./gallery-utils";
import { StickyBuyBar } from "./sticky-buy-bar.client";
import { key_facts_line } from "./key-facts";
import { ProductBadges } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/product-badges";
import { EnquiryForm, PRODUCT_ENQUIRY_TYPE } from "@/components/enquiry-form.client";
import { NotifySimilar, useNotifySimilarAvailable } from "@/components/notify-similar.client";
import { NOTIFY_ATTRIBUTES } from "@/lib/contact-forms-config";
import { notify_body } from "@/lib/notify-body";
import { KEY_FACTS } from "@/lib/product-config";
import { description_html, has_text } from "@/lib/rich-html";

const PLACEHOLDER_MEDIA = [[{ uri: image_placeholder, width: 600, height: 600 }]];


// `related`: the streamed similar-products section (it renders nothing when there are none), placed here by
// stock. Whether it holds any is read from the DOM by CSS (`has-[[data-related-products]]`).
// Long names step the title down one size, so a two-line name does not dominate the column.
const LONG_TITLE = 40;
const title_size = (name: string) =>
  name.length > LONG_TITLE ? "text-xl md:text-2xl" : "text-2xl md:text-3xl";

export function ProductClient({ product_url_key, related }: { product_url_key: string; related: ReactNode }) {
  const { t, language } = useI18n();
  const api = useMemo(() => create_api(make_client_access()), []);
  const { data: product, isLoading, error } = useQuery(
    product_query(api, { product_url_key })
  );

  // Configurable product: variant choice, price, stock and cart line (null for other types).
  const configurable = useProductVariants(api, product, product_url_key);

  const { data: stock, isPending } = useQuery({
    ...stock_query(api, { sku: product?.sku ?? "" }),
    enabled: !!product?.sku && !configurable,
  });
  // A disabled query stays pending: a configurable product reads its variants' stock instead.
  const stockPending = !configurable && isPending;
  const max = configurable ? configurable.max : (stock?.quantity ?? 0);
  const inStock = configurable ? configurable.in_stock : !!stock?.is_in_stock && max > 0;

  // Stock arrives after the product: no attribute until it is known.
  const stock_known = !!configurable || stock !== undefined;

  const add = useCartStore((s) => s.add);
  const show_added = useAddedToCart((s) => s.show);
  const [qty, setQty] = useState(1);

  const notify_available = useNotifySimilarAvailable();
  const [notify_open, setNotifyOpen] = useState(false);
  const buy_area = useRef<HTMLDivElement>(null);

  if (isLoading) return <PageLoading />;
  if (error || !product) return <div>{t("product.not_found")}</div>;

  const purchasable = !!configurable || product.purchasable;
  const canBuy = purchasable && inStock;

  const media = configurable?.media ?? (product.media?.length ? product.media : PLACEHOLDER_MEDIA);
  const buy = {
    sku: product.sku,
    name: product.name,
    url_key: product_url_key,
    price: product.price,
    media,
    ...configurable?.buy,
  };

  const category = (product.categories as { name?: string; url_key?: string }[] | undefined)?.[0];
  // Sold out for good (stock answered, nothing to buy): offer to be told about a similar product.
  const sold_out = stock_known && (configurable ? configurable.sold_out : !inStock);
  // Until the real-time stock answers, the product's own flag decides where the similar products go.
  const sold = stock_known ? sold_out : product.on_stock === false;
  // A single piece cannot be bought twice: no stepper then.
  const single_piece = stock_known && max === 1;
  const facts = key_facts_line(product.attributes, KEY_FACTS, language);
  const notify_visible = sold_out && notify_available;

  const add_to_cart = () => {
    add(buy, qty, max);
    show_added({
      sku: buy.sku,
      // The variant goes on its own line, so the product name without the "(S/M)" suffix.
      name: configurable ? product.name : buy.name,
      quantity: qty,
      price: buy.price,
      image: media[0]?.[0]?.uri ?? null,
      options: configurable?.axes.flatMap((axis) => {
        const option = axis.options.find((o) => o.value === configurable.selection[axis.idx]);
        return option ? [{ axis: axis.label, value: option.label }] : [];
      }),
    });
  };
  // Until stock answers the button stays "Add to cart" (disabled), so an
  // in-stock product never flashes "Out of stock".
  const cta_label =
    configurable?.cta ??
    (!product.purchasable
      ? t("product.not_available_online")
      : inStock || stockPending
        ? t("product.add_to_cart")
        : t("product.out_of_stock"));
  const open_notify = () => {
    setNotifyOpen(true);
    buy_area.current?.scrollIntoView({ block: "center", behavior: scroll_behavior() });
  };
  const related_section = (
    <div
      data-stock={sold ? "out" : "in"}
      className={cn("group/related hidden has-[[data-related-products]]:block", sold && "border-t border-border pt-5")}
    >
      {related}
    </div>
  );

  return (
    <div
      // Room under the page for the fixed buy bar on phones.
      className={cn("group/product flex flex-col gap-10", purchasable && "pb-16 md:pb-0")}
      data-product-page
      data-stock={stock_known ? (inStock ? "in" : "out") : undefined}
    >
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
      <Gallery media={media} name={product.name} />

      {/* Product info */}
      <section aria-label={t("product.details")} className="surface flex flex-col gap-8">
        {/* Meta: who, what, which. */}
        <div className="flex flex-col gap-3">
          {!!product.brands?.length && (
            <p className="text-xs text-muted-foreground">
              {product.brands.map((b: { name: string }) => b.name).join(", ")}
            </p>
          )}
          <ProductBadges badges={product.badges} percent_off={product.percent_off} />
          <h1 className={cn("text-balance leading-tight", title_size(product.name))}>{product.name}</h1>
          {facts && (
            <p data-key-facts className="text-sm text-muted-foreground">
              {facts}
            </p>
          )}
          <p data-product-sku className="text-xs text-muted-foreground">
            {t("product.sku_line", { sku: product.sku })}
          </p>
        </div>

        {/* Price and whether it can be bought now. */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {configurable ? (
              <VariantPrice price={configurable.price} from={configurable.price_from} large />
            ) : (
              <ProductPrice price={product.price} sku={product.sku} large />
            )}
            {purchasable && <span className="text-xs text-muted-foreground">{t("product.incl_vat")}</span>}
          </div>
          {purchasable && !stockPending && (!configurable || configurable.buy) && (
            <p className="flex items-center gap-2 text-sm">
              <span
                aria-hidden
                className={inStock ? "size-2 rounded-full bg-positive" : "size-2 rounded-full bg-muted-foreground"}
              />
              {inStock ? t("product.in_stock") : t("product.out_of_stock")}
            </p>
          )}
        </div>

        {/* Actions. */}
        <div className="flex flex-col gap-3">
          {configurable && <VariantPicker {...configurable} />}
          <div ref={buy_area} data-buy-area className="flex items-center gap-2 md:gap-3">
            {!single_piece && (
              <>
                <span className="sr-only">{t("product.quantity")}</span>
                <QuantityStepper
                  size="lg"
                  value={Math.min(qty, Math.max(max, 1))}
                  onChange={setQty}
                  max={Math.max(max, 1)}
                  disabled={!canBuy}
                />
              </>
            )}
            <Button size="lg" className="min-w-0 flex-1 px-4 md:px-6" disabled={!canBuy} onClick={add_to_cart}>
              {cta_label}
            </Button>
            <WishlistButton
              sku={product.sku}
              item={{
                sku: product.sku,
                name: product.name,
                url_key: product_url_key,
                price: product.price,
                description: product.description ?? "",
                media: media,
              }}
              variant="outline"
              size="icon-lg"
              className="shrink-0 rounded-chip"
            />
          </div>
          {sold_out && (
            <NotifySimilar
              body={notify_body(product, category?.name, NOTIFY_ATTRIBUTES)}
              code={product.sku}
              trigger_label={t("product.notify_similar")}
              open={notify_open}
              onOpenChange={setNotifyOpen}
            />
          )}

          {/* Without a price the enquiry is the way to buy; with one it stays a quiet question. */}
          <EnquiryForm
            form_type={PRODUCT_ENQUIRY_TYPE}
            slug={PRODUCT_ENQUIRY_TYPE}
            context={{ sku: product.sku, name: product.name }}
            collapsed_label={purchasable ? t("product.ask_about") : t("product.ask_price")}
            collapsed_primary={!purchasable}
          />
        </div>

        {has_text(product.description) && (
          <div className="border-t pt-8">
            <SanitizeHTML html={description_html(product.description ?? "")} className="text-muted-foreground" />
          </div>
        )}

        {product.specs?.length > 0 && (
          <div className="border-t pt-8">
            <ProductSpecs groups={product.specs} categories={product.categories} />
          </div>
        )}

        {sold && related_section}
      </section>
    </div>

      <ProductStories stories={product.stories ?? []} />

      {!sold && related_section}

      {purchasable && (
        <StickyBuyBar target={buy_area}>
          {!sold_out && <ProductPrice price={configurable ? configurable.price : product.price} />}
          {sold_out ? (
            <>
              {/* With the notify action the bar has room for two buttons only: the marker stays in the buy area. */}
              {!notify_visible && <span data-unavailable className="text-sm font-medium">{t("product.out_of_stock")}</span>}
              <Button
                asChild
                variant="outline"
                className={cn(
                  "hidden group-has-[[data-related-products]]/product:inline-flex",
                  notify_visible ? "shrink-0" : "ml-auto",
                )}
              >
                <Link href="#related-products">{t("product.see_similar")}</Link>
              </Button>
              {notify_visible && (
                <Button className="min-w-0 flex-1" data-notify-bar-trigger onClick={open_notify}>
                  {t("product.notify_short")}
                </Button>
              )}
            </>
          ) : (
            <Button className="ml-auto flex-1" disabled={!canBuy} onClick={add_to_cart}>
              {cta_label}
            </Button>
          )}
        </StickyBuyBar>
      )}
    </div>
  );
}
