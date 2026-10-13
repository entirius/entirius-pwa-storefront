// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { API_CHECKOUT_COUNTRIES_ROUTE } from "@/API/api.routes";
import { COUNTRY_OPTIONS } from "@/utils/validation/address.schema";
import { useI18n } from "@/providers/i18n.provider";

export type CountryOption = { code: string; dialling_code: string; label: string };

type ChannelCountries = {
  countries: { code: string; label: string; prefix: string }[];
  default_country?: { code: string };
};

// Countries the checkout channel delivers to (GET checkout/{channel}/countries/), with the channel's
// default country. Names are localized with Intl in the active language; the API label is the
// fallback when Intl cannot name a code. While the call is loading, failed or empty, the fixed
// list of address.schema.ts stands in and `ready` stays false.
export function useCountryOptions() {
  const { country } = useI18n();
  const api = useMemo(() => create_api(make_client_access()), []);
  const { data } = useQuery({
    queryKey: ["checkout-countries"],
    queryFn: async () => {
      const [error, response] = await api.FETCH_METHOD(API_CHECKOUT_COUNTRIES_ROUTE);
      if (error) throw new Error(error.message);
      return response as ChannelCountries;
    },
    staleTime: 10 * 60_000,
  });

  return useMemo(() => {
    const channel = data?.countries ?? [];
    const ready = channel.length > 0;
    const source = ready
      ? channel.map((c) => ({ code: c.code, dialling_code: c.prefix, label: c.label }))
      : COUNTRY_OPTIONS.map((c) => ({ ...c, label: c.code }));
    const named: CountryOption[] = source.map((c) => {
      const label = country(c.code);
      return { ...c, label: label === c.code ? c.label : label };
    });
    const options = ready ? named.sort((a, b) => a.label.localeCompare(b.label)) : named;
    const dialling = [...new Set(options.map((o) => o.dialling_code))];
    const default_code = ready ? (data?.default_country?.code ?? options[0].code) : options[0].code;
    return { options, dialling, default_code, ready };
  }, [data, country]);
}
