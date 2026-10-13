// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { stock_quantity } from "@/lib/stock-batch";
import { useI18n } from "@/providers/i18n.provider";

// The label of a tile whose product is in stock with exactly one piece: message `product.single_piece`
// (empty by default = off, and then no stock request is made at all). `label` is "" until the stock is known.
export function useSinglePiece(sku: string, in_stock: boolean): string {
  const { t } = useI18n();
  const label = t("product.single_piece");
  const api = useMemo(() => create_api(make_client_access()), []);
  const { data: quantity } = useQuery({
    queryKey: ["stock-quantity", sku],
    queryFn: () => stock_quantity(api, sku),
    enabled: !!label && in_stock && !!sku,
    staleTime: 60_000,
  });
  return quantity === 1 ? label : "";
}
