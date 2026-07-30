"use client";

import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { API_PRODUCTS_ROUTE } from "@/API/api.routes";
import { NORM_PRODUCTS_DATA } from "@/utils/NORMALIZERS/product.normalizer";
import { ProductTile } from "@/app/[customer_country]/(catalog)/catalog/[catalog_url_key]/_components/product-tile.client";
import type { CmsSectionBaseProps } from "@/types/cms.types";

interface TileTypeBProps extends CmsSectionBaseProps {
  url_key?: string;
}

function TileShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="aspect-square w-full flex items-center justify-center bg-muted">
        {children}
      </div>
      <div className="p-2.5 flex flex-col gap-1">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="mt-1 h-5 w-1/3 rounded bg-muted" />
      </div>
    </div>
  );
}

export default function TileTypeB({ url_key }: TileTypeBProps) {
  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", url_key],
    queryFn: async () => {
      const api = create_api(make_client_access());
      const [err, response] = await api.FETCH_METHOD(API_PRODUCTS_ROUTE, {
        querys: { url_key, include: "full" },
      });
      if (err) throw new Error(err.message);
      return NORM_PRODUCTS_DATA((response as any)?.results ?? [])[0] ?? null;
    },
    enabled: !!url_key,
  });

  if (!url_key) {
    return (
      <TileShell>
        <p className="text-xs text-muted-foreground">Missing url_key</p>
      </TileShell>
    );
  }

  if (isLoading) {
    return (
      <TileShell>
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </TileShell>
    );
  }

  if (error || !product) {
    return (
      <TileShell>
        <p className="text-xs text-muted-foreground">Product unavailable</p>
        <p className="mt-1 text-[10px] text-muted-foreground">{url_key}</p>
      </TileShell>
    );
  }

  return <ProductTile product={product} />;
}
