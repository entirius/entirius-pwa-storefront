import { cache } from "react";
import { API_PRODUCTS_ROUTE, API_PRODUCT_VARIANTS_ROUTE } from "@/API/api.routes";
import { NORM_PRODUCTS_DATA } from "@/utils/NORMALIZERS/product.normalizer";
import { NORM_VARIANTS_DATA, type VariantsData } from "@/utils/NORMALIZERS/variant.normalizer";

type Api = { FETCH_METHOD: (path: string, options?: any) => Promise<any> };

export const product_query = (api: Api, options: { product_url_key: string }) => ({
  queryKey: ["product", options.product_url_key],
  queryFn: async () => {
    const [error, response] = await load_product(api, options);
    if (error) throw new Error(error.message);
    const products = NORM_PRODUCTS_DATA(response?.results ?? []);
    return products[0] ?? null;
  },
});

export const load_product = cache(async (api: Api, options: { product_url_key: string }) => {
  return api.FETCH_METHOD(API_PRODUCTS_ROUTE, {
    querys: { url_key: options.product_url_key, include: "full" },
  });
});

// Matrix product list page size is capped at 100 by the backend.
const MAX_VARIANTS = 100;

// Variants of a configurable product: axes, options and per-variant price / pictures / stock flag.
// null for every other product type. Runs after load_product (deduplicated by cache()), then needs
// two calls: the variants endpoint has no price or pictures, so the variant SKUs are looked up in
// the product list.
export const variants_query = (api: Api, options: { product_url_key: string }) => ({
  queryKey: ["product-variants", options.product_url_key],
  queryFn: async (): Promise<VariantsData | null> => {
    const [product_error, product_response] = await load_product(api, options);
    if (product_error) throw new Error(product_error.message);
    if (product_response?.results?.[0]?.product_type !== "CONFIGURABLE") return null;

    const [error, response] = await load_variants(api, options);
    if (error) throw new Error(error.message);
    const skus: string[] = (response?.data?.products ?? [])
      .map((p: { sku: string }) => p.sku)
      .slice(0, MAX_VARIANTS);
    if (!skus.length) return NORM_VARIANTS_DATA(response, []);

    const [details_error, details] = await load_variant_details(api, { skus });
    if (details_error) throw new Error(details_error.message);
    return NORM_VARIANTS_DATA(response, details?.results ?? []);
  },
});

export const load_variants = cache(async (api: Api, options: { product_url_key: string }) => {
  const path = API_PRODUCT_VARIANTS_ROUTE.replace(
    "__URL_KEY__",
    encodeURIComponent(options.product_url_key),
  );
  return api.FETCH_METHOD(path);
});

const load_variant_details = async (api: Api, options: { skus: string[] }) => {
  return api.FETCH_METHOD(API_PRODUCTS_ROUTE, {
    querys: { sku: options.skus, include: "content", page_size: options.skus.length },
  });
};
