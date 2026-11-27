// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { create_api } from "@/API/api.context";
import { API_AGREEMENT_CONTEXT_DEFINITIONS_ROUTE, API_AGREEMENT_DEFINITIONS_ROUTE } from "@/API/api.routes";
import { NORM_AGREEMENT_DEFINITIONS } from "@/utils/NORMALIZERS/agreement.normalizer";

type Api = ReturnType<typeof create_api>;

// Where the CMS lets a definition show up ("show in" of the agreement definition).
export type AgreementContext = "checkout" | "registration";

// The channel's agreement definitions in a language. One query for the root layout's server prefetch and the
// client (the review step, the legal links of the forms), so the client reads them from the hydrated cache.
export const agreement_definitions_query = (api: Api, language: string) => ({
  queryKey: ["agreement-definitions", language],
  queryFn: async () => {
    const [error, response] = await api.FETCH_METHOD(API_AGREEMENT_DEFINITIONS_ROUTE);
    if (error) throw new Error(error.message);
    return NORM_AGREEMENT_DEFINITIONS(response);
  },
});

// The definitions meant for one context, in a language: what the CMS ticked for it, no more. Same shape as the
// plain list, so one normalizer serves both.
export const agreement_context_query = (api: Api, language: string, context: AgreementContext) => ({
  queryKey: ["agreement-definitions", language, context],
  queryFn: async () => {
    const [error, response] = await api.FETCH_METHOD(API_AGREEMENT_CONTEXT_DEFINITIONS_ROUTE, { querys: { context } });
    if (error) throw new Error(error.message);
    return NORM_AGREEMENT_DEFINITIONS(response);
  },
});
