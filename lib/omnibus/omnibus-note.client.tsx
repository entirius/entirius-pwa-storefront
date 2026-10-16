// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { omnibus_query } from "./omnibus.query";
import { useI18n } from "@/providers/i18n.provider";

// The Omnibus line under a reduced price. Render it only next to a reduced price;
// nothing shows while loading or when the backend has no price history.
export function OmnibusNote({
  sku,
  compact = false,
}: {
  sku: string;
  compact?: boolean;
}) {
  const api = useMemo(() => create_api(make_client_access()), []);
  const { data } = useQuery(omnibus_query(api, sku));
  const i18n = useI18n();
  if (!data) return null;
  const price = i18n.price(data.gross, data.currency);
  return (
    <p className={compact ? "text-[10px] text-muted-foreground" : "text-xs text-muted-foreground"}>
      {compact
        ? i18n.t("omnibus.lowest_short", { price })
        : i18n.t("omnibus.lowest", { price })}
    </p>
  );
}
