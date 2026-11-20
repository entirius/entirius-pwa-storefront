// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { ReactNode } from "react";
import type { CmsTileTypeBProps } from "@entirius/storefront-sdk/cms";
import { ProductCard } from "@theme/components/product-card";

// Older content's product tile, by url key: the product card, or a card-shaped note when the key is missing or
// the shop does not sell the product.
export function TileTypeB({ t, url_key, product }: CmsTileTypeBProps) {
  if (product) return <ProductCard product={product} />;
  return (
    <Placeholder>
      <p className="text-xs text-muted-foreground">{t(url_key ? "cms.product_unavailable" : "cms.missing_url_key")}</p>
      {url_key && <p className="mt-1 text-[10px] text-muted-foreground">{url_key}</p>}
    </Placeholder>
  );
}

function Placeholder({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex aspect-product w-full flex-col items-center justify-center bg-muted">{children}</div>
      <div className="flex flex-col gap-1 p-2.5">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="mt-1 h-5 w-1/3 rounded bg-muted" />
      </div>
    </div>
  );
}
