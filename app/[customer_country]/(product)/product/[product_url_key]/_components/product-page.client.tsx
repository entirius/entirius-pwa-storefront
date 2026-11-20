// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductPageProvider, type ProductPageModel } from "@entirius/storefront-sdk/product/page";
import type { ProductMedia } from "@entirius/storefront-sdk/product";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { PageLoading } from "@theme/ui/spinner";
import { image_placeholder } from "@/utils/NORMALIZERS/media.normalizer";
import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import { useCartStore } from "@/stores/cart.store";
import { notify } from "@/stores/notices.store";
import { filters_query } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/api.query";
import { product_query } from "../api.query";
import { stock_query } from "../stock.query";
import { useProductVariants } from "./use-product-variants";
import { key_facts_line } from "./key-facts";
import { EnquiryForm, PRODUCT_ENQUIRY_TYPE } from "@/components/enquiry-form.client";
import { NotifySimilar, useNotifySimilarAvailable } from "@/components/notify-similar.client";
import { StockAlertForm } from "@/components/stock-alert.client";
import { NOTIFY_ATTRIBUTES } from "@/lib/contact-forms-config";
import { notify_body } from "@/lib/notify-body";
import { KEY_FACTS } from "@/lib/product-config";
import { description_html, has_text } from "@/lib/rich-html";
import { asks_stock, buy_block, sold_online } from "@/lib/buy-rules";
import { useStockAlertsAvailable } from "@/lib/stock-alerts";

const PLACEHOLDER_MEDIA: ProductMedia = [[{ uri: image_placeholder, width: 600, height: 600 }]];

const scroll_behavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

type Category = { name?: string; url_key: string; path?: unknown[] };

// Spec values link to the filtered listing of the product's top category, when that category filters by them.
const filter_category = (categories: Category[] | undefined): string | undefined =>
  [...(categories ?? [])].sort((a, b) => (a.path?.length ?? 1) - (b.path?.length ?? 1))[0]?.url_key;

function useSpecLinks(categories: Category[] | undefined) {
  const api = useMemo(() => create_api(make_client_access()), []);
  const category = filter_category(categories);
  const { data: filters } = useQuery({
    ...filters_query(api, { category }),
    enabled: !!category,
    staleTime: 10 * 60_000,
  });
  return (idx: string | null, value_idx: string | null): string | null => {
    const filter = idx ? filters?.data?.q_?.[`q_${idx}`] : undefined;
    if (!category || !idx || !value_idx || !filter?.options.some((o: { idx: string }) => o.idx === value_idx)) return null;
    return `/catalog/${category}?q_${idx}=${encodeURIComponent(value_idx)}`;
  };
}

// The product page's model for the theme's template (@theme/product/product-page): the product, its variants, the
// real-time stock and the buy rules, with the actions. `related`: the streamed similar-products section.
export function ProductPageRuntime({
  product_url_key,
  related,
  children,
}: {
  product_url_key: string;
  related: ReactNode;
  children: ReactNode;
}) {
  const { t, language } = useI18n();
  const api = useMemo(() => create_api(make_client_access()), []);
  const { data: product, isLoading, error } = useQuery(product_query(api, { product_url_key }));

  // Configurable product: variant choice, price, stock and cart line (null for other types).
  const configurable = useProductVariants(api, product, product_url_key);

  // A configurable product reads its variants' stock instead; a CUSTOM one needs none.
  const { data: stock } = useQuery({
    ...stock_query(api, { sku: product?.sku ?? "" }),
    enabled: !!product?.sku && !configurable && asks_stock(product?.product_type),
  });
  const max = configurable ? configurable.max : (stock?.quantity ?? 0);
  const inStock = configurable ? configurable.in_stock : max > 0;

  // Stock arrives after the product: no attribute until it is known, nor after a failed call.
  const stock_known = configurable ? configurable.stock_known : stock !== undefined;

  const add = useCartStore((s) => s.add);
  const [qty, setQty] = useState(1);

  const notify_available = useNotifySimilarAvailable();
  const [notify_open, setNotifyOpen] = useState(false);
  const buy_area = useRef<HTMLDivElement>(null);
  const alerts = useStockAlertsAvailable();
  const query_client = useQueryClient();
  const categories = product?.categories as Category[] | undefined;
  const spec_link = useSpecLinks(categories);

  if (isLoading) return <PageLoading />;
  if (error || !product) return <div>{t("product.not_found")}</div>;

  const block = configurable
    ? configurable.block
    : buy_block(product.product_type, { quantity: stock?.quantity, price: product.price });
  // Sold online: only the stock or the variant choice can stop it.
  const purchasable = sold_online(block);
  // Nothing stops it and the real-time stock has answered: an unknown stock never opens the button.
  const canBuy = block === null && stock_known;

  const media = configurable?.media ?? (product.media?.length ? product.media : PLACEHOLDER_MEDIA);
  const buy = {
    sku: product.sku,
    name: product.name,
    url_key: product_url_key,
    price: product.price,
    media,
    ...configurable?.buy,
  };

  const category = categories?.[0];
  // Sold out for good (stock answered, nothing to buy): offer to be told about a similar product.
  const sold_out = purchasable && stock_known && (configurable ? configurable.sold_out : !inStock);
  // Until the real-time stock answers, the product's own flag decides where the similar products go.
  const sold = stock_known ? sold_out : purchasable && product.on_stock === false;
  // A single piece cannot be bought twice: no stepper then.
  const single_piece = stock_known && max === 1;
  // Back-in-stock request: the chosen variant (or the product) is sold out by the real-time stock. With every
  // variant sold out and none chosen, the buy area asks for a choice first.
  const alert_sku = alerts && stock_known && block === "quantity" ? buy.sku : null;
  const alert_choose = alerts && stock_known && !!configurable?.sold_out && block === "variant";

  // The variant's name carries its "(S/M)", so the notice names what went in.
  const add_to_cart = () => {
    add(buy, qty, max);
    notify({
      message: "catalog.quick_add_added",
      params: { name: buy.name },
      action: { label: "cart.view", href: "/cart" },
    });
  };
  // Until stock answers the button stays "Add to cart" (disabled): an unknown stock passes the rules, so an
  // in-stock product never flashes "Out of stock".
  const label =
    configurable?.cta ??
    (block === "quantity"
      ? t("product.out_of_stock")
      : block === null
        ? t("product.add_to_cart")
        : t("product.not_available_online"));
  const scroll_to_buy_area = () => buy_area.current?.scrollIntoView({ block: "center", behavior: scroll_behavior() });
  // The backend says the SKU can be bought after all: re-read the stock, the buy button comes back with it.
  const refetch_stock = () => {
    query_client.invalidateQueries({ queryKey: ["stock"] });
    query_client.invalidateQueries({ queryKey: ["stocks"] });
  };

  const model: ProductPageModel = {
    product: {
      sku: product.sku,
      name: product.name,
      url_key: product_url_key,
      brands: (product.brands ?? []).map((b: { name: string }) => b.name),
      badges: product.badges ?? null,
      percent_off: product.percent_off ?? null,
      key_facts: key_facts_line(product.attributes, KEY_FACTS, language),
      description_html: has_text(product.description) ? description_html(product.description ?? "") : null,
      specs: product.specs ?? [],
      stories: product.stories ?? [],
    },
    media,
    price: configurable
      ? { value: configurable.price, from: configurable.price_from, omnibus_sku: null }
      : { value: product.price, from: false, omnibus_sku: product.sku },
    purchasable,
    stock: {
      known: stock_known,
      in_stock: inStock,
      show_status: purchasable && stock_known && (!configurable || !!configurable.buy),
      sold_out,
      sold,
    },
    variants: configurable && {
      axes: configurable.axes,
      selection: configurable.selection,
      choose: configurable.choose,
      is_available: configurable.is_available,
      sold_out_selectable: alerts,
    },
    buy: {
      mode: alert_sku ? "stock_alert" : alert_choose ? "choose_option" : "buy",
      can_buy: canBuy,
      label,
      single_piece,
      quantity: Math.min(qty, Math.max(max, 1)),
      set_quantity: setQty,
      max: Math.max(max, 1),
      add_to_cart,
    },
    wishlist_item: {
      sku: product.sku,
      name: product.name,
      url_key: product_url_key,
      price: product.price,
      product_type: product.product_type,
      description: product.description ?? "",
      media,
    },
    notify_similar: {
      visible: sold_out && notify_available && !alert_sku,
      open: () => {
        setNotifyOpen(true);
        scroll_to_buy_area();
      },
    },
    spec_link,
    blocks: {
      // Without a price the enquiry is the way to buy; with one it stays a quiet question.
      enquiry: (
        <EnquiryForm
          form_type={PRODUCT_ENQUIRY_TYPE}
          slug={PRODUCT_ENQUIRY_TYPE}
          context={{ sku: product.sku, name: product.name }}
          collapsed_label={purchasable ? t("product.ask_about") : t("product.ask_price")}
          collapsed_primary={!purchasable}
        />
      ),
      stock_alert: alert_sku && (
        <StockAlertForm
          key={alert_sku}
          sku={alert_sku}
          product_name={product.name}
          option_line={configurable?.option_line}
          onInStock={refetch_stock}
          className="min-w-0 flex-1"
        />
      ),
      notify_similar: sold_out && (
        <NotifySimilar
          body={notify_body(product, category?.name, NOTIFY_ATTRIBUTES)}
          code={product.sku}
          trigger_label={t("product.notify_similar")}
          open={notify_open}
          onOpenChange={setNotifyOpen}
        />
      ),
    },
    related,
    buy_area,
    scroll_to_buy_area,
  };

  return <ProductPageProvider value={model}>{children}</ProductPageProvider>;
}
