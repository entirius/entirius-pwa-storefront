// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { create_api } from "@/API/api.context";
import { API_AGREEMENT_DEFINITIONS_ROUTE } from "@/API/api.routes";
import { NORM_AGREEMENT_DEFINITIONS } from "@/utils/NORMALIZERS/agreement.normalizer";

type Api = ReturnType<typeof create_api>;

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
