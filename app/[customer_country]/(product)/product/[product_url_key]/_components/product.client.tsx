// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import { MediaImage } from "@/components/ui/media-image.client";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
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
import { ProductBadges } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/product-badges";
import { MoreFromCategory } from "./more-from-category.client";
import { EnquiryForm, PRODUCT_ENQUIRY_TYPE } from "@/components/enquiry-form.client";
import { NotifySimilar } from "@/components/notify-similar.client";
import { NOTIFY_ATTRIBUTES } from "@/lib/contact-forms-config";
import { notify_body } from "@/lib/notify-body";

const PLACEHOLDER_MEDIA = [[{ uri: image_placeholder, width: 600, height: 600 }]];


export function ProductClient({ product_url_key }: { product_url_key: string }) {
  const { t } = useI18n();
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

  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(1);

  useEffect(() => {
    if (!carouselApi) return;
    setTotal(carouselApi.scrollSnapList().length);
    setCurrent(carouselApi.selectedScrollSnap() + 1);
    const onSelect = () => setCurrent(carouselApi.selectedScrollSnap() + 1);
    carouselApi.on("select", onSelect);
    return () => { carouselApi.off("select", onSelect); };
  }, [carouselApi]);

  if (isLoading) return <div>{t("common.loading")}</div>;
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

  return (
    <div
      className="flex flex-col gap-10"
      data-product-page
      data-stock={stock_known ? (inStock ? "in" : "out") : undefined}
    >
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
      {/* Carousel */}
      <div className="rounded-4xl bg-card p-3 md:sticky md:top-24 md:self-start">
        <Carousel setApi={setCarouselApi} className="relative">
          <CarouselContent>
            {media.map((variants: any[], i: number) => {
              const img = variants[0];
              return (
                <CarouselItem key={i}>
                  <AspectRatio ratio={1} className="bg-muted overflow-hidden rounded-3xl">
                    <MediaImage
                      src={img.uri}
                      alt={t("product.image", { name: product.name, number: i + 1 })}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </AspectRatio>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          {media.length > 1 && (
            <>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
              <div className="absolute bottom-2 right-3 text-xs text-heading bg-background/70 rounded px-1.5 py-0.5">
                {current} / {total}
              </div>
            </>
          )}
        </Carousel>
        {media.length > 1 && (
          <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
            {media.map((variants: { uri: string }[], i: number) => (
              <button
                key={i}
                type="button"
                aria-label={t("product.show_image", { number: i + 1 })}
                aria-current={current === i + 1 ? "true" : undefined}
                onClick={() => carouselApi?.scrollTo(i)}
                className={
                  current === i + 1
                    ? "relative aspect-square overflow-hidden rounded-2xl bg-muted ring-2 ring-primary"
                    : "relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-border hover:ring-primary"
                }
              >
                <MediaImage src={variants[0].uri} alt="" fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product info */}
      <section aria-label={t("product.details")} className="flex flex-col gap-5 rounded-4xl bg-card p-6 md:p-8">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            {product.brands?.length > 0 ? (
              <span>{product.brands.map((b: { name: string }) => b.name).join(", ")}</span>
            ) : (
              <span />
            )}
            <span className="font-mono text-xs">{product.sku}</span>
          </div>
          <ProductBadges badges={product.badges} percent_off={product.percent_off} />
          <h1 className="text-3xl leading-tight md:text-4xl">{product.name}</h1>
        </div>

        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
          {configurable ? (
            <VariantPrice price={configurable.price} from={configurable.price_from} large />
          ) : (
            <ProductPrice price={product.price} sku={product.sku} large />
          )}
          {purchasable && (
            <span className="pb-1.5 text-sm text-muted-foreground">{t("product.incl_vat")}</span>
          )}
        </div>

        {configurable && <VariantPicker {...configurable} />}

        {product.description && (
          <SanitizeHTML html={product.description} className="text-muted-foreground" />
        )}

        {purchasable && !stockPending && (!configurable || configurable.buy) && (
          <p className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className={inStock ? "size-2 rounded-full bg-positive" : "size-2 rounded-full bg-muted-foreground"}
            />
            {inStock ? t("product.in_stock") : t("product.out_of_stock")}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <span className="sr-only">{t("product.quantity")}</span>
          <QuantityStepper
            size="lg"
            value={Math.min(qty, Math.max(max, 1))}
            onChange={setQty}
            max={Math.max(max, 1)}
            disabled={!canBuy}
          />
          <Button
            size="lg"
            className="flex-1 rounded-full"
            disabled={!canBuy}
            onClick={() => {
              add(buy, qty, max);
              show_added({
                sku: buy.sku,
                name: buy.name,
                quantity: qty,
                price: buy.price,
                image: media[0]?.[0]?.uri ?? null,
              });
            }}
          >
            {/* Until stock answers the button stays "Add to cart" (disabled), so an
                in-stock product never flashes "Out of stock". */}
            {configurable?.cta ??
              (!product.purchasable
                ? t("product.not_available_online")
                : inStock || stockPending
                  ? t("product.add_to_cart")
                  : t("product.out_of_stock"))}
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
            className="rounded-full"
          />
        </div>

        {sold_out && (
          <NotifySimilar
            body={notify_body(product, category?.name, NOTIFY_ATTRIBUTES)}
            code={product.sku}
            trigger_label={t("product.notify_similar")}
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
      </section>
    </div>

      {product.specs?.length > 0 && (
        <div className="rounded-4xl bg-card p-6 md:p-10">
          <ProductSpecs groups={product.specs} />
        </div>
      )}

      {category?.url_key && (
        <MoreFromCategory
          category={category.url_key}
          name={category.name ?? t("product.this_category")}
          exclude_sku={product.sku}
        />
      )}
    </div>
  );
}
