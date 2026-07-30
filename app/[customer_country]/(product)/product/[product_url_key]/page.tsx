import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { product_query } from "./api.query";
import { create_api } from "@/API/api.context";
import { make_server_access } from "@/API/access/api.server-access";
import { ProductClient } from "./_components/product.client";

interface Props {
  params: Promise<{ customer_country: string; product_url_key: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { product_url_key } = await params;
  const api = create_api(await make_server_access());

  return (
    <PrefetchBoundary prefetches={[product_query(api, { product_url_key })]}>
      <ProductClient product_url_key={product_url_key} />
    </PrefetchBoundary>
  );
}
