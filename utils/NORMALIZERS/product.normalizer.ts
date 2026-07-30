import { NORM_MEDIA_DATA } from "@/utils/NORMALIZERS/media.normalizer";
import { NORM_PRICE_DATA } from "@/utils/NORMALIZERS/price.normalizer";


function NORM_PRODUCTS_DATA(products: any[]) {
  if (!products) {
    return [];
  }
  return products.map((product) => ({
    ...product,
    price: NORM_PRICE_DATA(product.price),
    media: NORM_MEDIA_DATA(product.media ?? [], {
      sort_by: "position",
      remove_kvp: [["type", "video"]],
    }),
  }));
}

export { NORM_PRODUCTS_DATA };
