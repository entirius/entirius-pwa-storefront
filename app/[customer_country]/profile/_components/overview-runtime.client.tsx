// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState, type ReactNode } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountOverviewProvider, type AccountOverviewModel } from "@entirius/storefront-sdk/account/page";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { customer_address_lines, order_summary_model } from "@/lib/account-models";
import { profile_query } from "../api.query";
import { orders_query } from "../orders/api.query";
import { addresses_query, defaults_query } from "../addresses/api.query";
import { ProfileEditForm } from "./profile-edit-form";
import { ChangePasswordForm } from "./change-password-form";

// The account overview's model for the theme's template (@theme/account/overview-page): the profile (editable in
// place), the latest order, the default address, the password form.
export function OverviewRuntime({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const i18n = useI18n();
  const [editing, setEditing] = useState(false);
  const [password_editing, setPasswordEditing] = useState(false);
  const [password_changed, setPasswordChanged] = useState(false);
  const profile = useQuery(profile_query());
  const orders = useInfiniteQuery(orders_query());
  const addresses = useQuery(addresses_query());
  const { data: defaults } = useQuery(defaults_query());

  const latest = orders.data?.pages[0]?.orders[0];
  const saved = addresses.data ?? [];
  const address = saved.find((a) => a.address_id === defaults?.shipping_address) ?? saved[0];

  const model: AccountOverviewModel = {
    details: profile.isLoading
      ? undefined
      : {
          name: profile.data ? `${profile.data.firstname} ${profile.data.lastname}`.trim() : "",
          email: profile.data?.email ?? null,
          editing: editing && !!profile.data,
          edit: () => setEditing(true),
          form: profile.data ? (
            <ProfileEditForm
              profile={profile.data}
              onCancel={() => setEditing(false)}
              onSaved={(p) => {
                queryClient.setQueryData(["profile"], p);
                setEditing(false);
              }}
            />
          ) : null,
        },
    latest_order: orders.isLoading ? undefined : latest ? order_summary_model(latest, i18n) : null,
    address: addresses.isLoading ? undefined : { lines: address ? customer_address_lines(address) : null, count: saved.length },
    password: {
      editing: password_editing,
      changed: password_changed,
      edit: () => {
        setPasswordChanged(false);
        setPasswordEditing(true);
      },
      form: (
        <ChangePasswordForm
          onCancel={() => setPasswordEditing(false)}
          onChanged={() => {
            setPasswordEditing(false);
            setPasswordChanged(true);
          }}
        />
      ),
    },
  };

  return <AccountOverviewProvider value={model}>{children}</AccountOverviewProvider>;
}
