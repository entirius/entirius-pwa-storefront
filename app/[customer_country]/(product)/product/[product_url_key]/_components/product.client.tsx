"use client";
import Image from "next/image";
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
import { product_query } from "../api.query";
import { stock_query } from "../stock.query";
import { ProductPrice } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/product-price.client";

const PLACEHOLDER_MEDIA = [[{ uri: image_placeholder, width: 600, height: 600 }]];


export function ProductClient({ product_url_key }: { product_url_key: string }) {
  const api = useMemo(() => create_api(make_client_access()), []);
  const { data: product, isLoading, error } = useQuery(
    product_query(api, { product_url_key })
  );

  const { data: stock } = useQuery({
    ...stock_query(api, { sku: product?.sku ?? "" }),
    enabled: !!product?.sku,
  });
  const max = stock?.quantity ?? 0;
  const inStock = !!stock?.is_in_stock && max > 0;

  const add = useCartStore((s) => s.add);
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

  if (isLoading) return <div>Loading...</div>;
  if (error || !product) return <div>Product not found</div>;

  const media = product.media?.length ? product.media : PLACEHOLDER_MEDIA;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Carousel */}
      <div className="md:sticky md:top-24 md:self-start">
        <Carousel setApi={setCarouselApi} className="relative">
          <CarouselContent>
            {media.map((variants: any[], i: number) => {
              const img = variants[0];
              return (
                <CarouselItem key={i}>
                  <AspectRatio ratio={1} className="bg-muted overflow-hidden rounded-md">
                    <Image
                      src={img.uri}
                      alt={`${product.name} – image ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover grayscale dark:brightness-20"
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
              <div className="absolute bottom-2 right-3 text-xs text-white bg-black/50 rounded px-1.5 py-0.5">
                {current} / {total}
              </div>
            </>
          )}
        </Carousel>
      </div>

      {/* Product info */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{product.sku}</p>
          <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
        </div>

        <ProductPrice price={product.price} />

        {product.description && (
          <>
            <hr className="border-border" />
            <SanitizeHTML html={product.description} className="text-sm text-muted-foreground" />
          </>
        )}

        <hr className="border-border" />

        <div className="flex items-center gap-3 mt-4">
          <span className="text-sm text-muted-foreground">Quantity</span>
          <QuantityStepper
            value={qty}
            onChange={setQty}
            max={Math.max(max, 1)}
            disabled={!inStock}
          />
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={!inStock}
            onClick={() =>
              add(
                {
                  sku: product.sku,
                  name: product.name,
                  url_key: product_url_key,
                  price: product.price,
                  media,
                },
                qty,
                max
              )
            }
          >
            {inStock ? "Add to cart" : "Out of stock"}
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
          />
        </div>
      </div>
    </div>
  );
}
