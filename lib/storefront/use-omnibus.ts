// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { omnibus_query } from "@/lib/omnibus/omnibus.query";

export function useOmnibus(sku: string) {
  const api = useMemo(() => create_api(make_client_access()), []);
  const { data } = useQuery(omnibus_query(api, sku));
  return data ?? null;
}
