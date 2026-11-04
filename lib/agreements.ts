// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import { API_ORDER_AGREEMENTS_ROUTE } from "@/API/api.routes";
import { agreement_definitions_query } from "@/lib/agreements.query";
import { PRIVACY_ROUTE, TERMS_ROUTE } from "@/lib/checkout-config";
import { _LOGGER } from "@/lib/logger";
import { useI18n } from "@/providers/i18n.provider";
import { legal_routes } from "@/utils/NORMALIZERS/agreement.normalizer";

type Api = ReturnType<typeof create_api>;

// The channel's agreement definitions in the active language (prefetched by the root layout).
export function useAgreementDefinitions(language: string) {
  const api = useMemo(() => create_api(make_client_access()), []);
  return useQuery({ ...agreement_definitions_query(api, language), staleTime: 5 * 60_000, retry: 1 });
}

// The CMS routes of the terms and the privacy policy for the legal links of the forms: the agreement definitions
// name them (`content_route`); `CHECKOUT.TERMS_ROUTE` / `PRIVACY_ROUTE` of _CONFIG stand in only when the backend
// has no such definition or does not answer.
export function useLegalRoutes() {
  const { language } = useI18n();
  const { data } = useAgreementDefinitions(language);
  return legal_routes(data, { terms: TERMS_ROUTE, privacy: PRIVACY_ROUTE });
}

// Records the agreements accepted at checkout with the order. Only possible once the order exists (the backend
// checks the order and its email), so the order is placed first. A repeat records nothing new, so one failed call
// is tried again; after that the failure is logged and the order stands: the customer did accept, the review step
// does not let an order through without it.
export async function record_order_agreements(
  api: Api,
  order: { order_id: string; email: string; slugs: string[]; language: string },
): Promise<boolean> {
  const { order_id, email, slugs, language } = order;
  if (!order_id || !email || slugs.length === 0) return false;
  const send = () =>
    api.FETCH_METHOD(API_ORDER_AGREEMENTS_ROUTE, {
      method: "POST",
      suffix: [order_id, "agreements"],
      body: JSON.stringify({ email, slugs, language }),
    });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const [error] = await send();
      if (!error) return true;
      if (attempt === 1 || error.status === 400 || error.status === 401 || error.status === 404) {
        _LOGGER({ type: "warning", message: "[agreements] not recorded with the order", print: { order_id, error } });
        return false;
      }
    } catch (e) {
      if (attempt === 1) _LOGGER({ type: "warning", message: "[agreements] not recorded with the order", print: e });
    }
  }
  return false;
}
