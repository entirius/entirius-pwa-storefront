// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";

import { LinkDynamic } from "@/lib/link-dynamic";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { format_order_date, status_style } from "@/utils/NORMALIZERS/order.normalizer";
import { useI18n } from "@/providers/i18n.provider";
import { profile_query } from "../api.query";
import { orders_query } from "../orders/api.query";
import { addresses_query, defaults_query } from "../addresses/api.query";
import { ProfileEditForm } from "./profile-edit-form";
import { ChangePasswordForm } from "./change-password-form";

// Account overview: details (editable), the latest order, the default address, the password.
export function ProfileClient() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const { data: profile, isLoading } = useQuery(profile_query());

  if (isLoading) {
    return (
      <div className="py-8">
        <Spinner className="size-5" />
      </div>
    );
  }

  const name = profile ? `${profile.firstname} ${profile.lastname}`.trim() : "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl">{t("profile.title")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("profile.intro")}
        </p>
      </div>

      <LatestOrder />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="account-details" className="surface flex flex-col gap-4">
          <h2 id="account-details" className="text-xl">
            {t("profile.account_details")}
          </h2>
          {editing && profile ? (
            <ProfileEditForm
              profile={profile}
              onCancel={() => setEditing(false)}
              onSaved={(p) => {
                queryClient.setQueryData(["profile"], p);
                setEditing(false);
              }}
            />
          ) : (
            <>
              <div className="flex flex-col gap-1">
                {name && <p className="text-lg font-medium text-heading">{name}</p>}
                <p className="text-sm text-muted-foreground">{profile?.email ?? "—"}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setEditing(true)}
              >
                {t("common.edit")}
              </Button>
            </>
          )}
        </section>
        <DefaultAddress />
        <Password />
      </div>
    </div>
  );
}

function Password() {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [changed, setChanged] = useState(false);

  return (
    <section aria-labelledby="password" className="surface flex flex-col gap-4">
      <h2 id="password" className="text-xl">
        {t("profile.password")}
      </h2>
      {editing ? (
        <ChangePasswordForm
          onCancel={() => setEditing(false)}
          onChanged={() => {
            setEditing(false);
            setChanged(true);
          }}
        />
      ) : (
        <>
          {changed && (
            <p role="status" className="text-sm text-muted-foreground">
              {t("profile.password_changed")}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => {
              setChanged(false);
              setEditing(true);
            }}
          >
            {t("profile.change_password")}
          </Button>
        </>
      )}
    </section>
  );
}

function LatestOrder() {
  const i18n = useI18n();
  const { t } = i18n;
  const { data, isLoading } = useInfiniteQuery(orders_query());
  const order = data?.pages[0]?.orders[0];
  const style = order ? status_style(order.status) : null;

  return (
    <section aria-labelledby="latest-order" className="surface flex flex-col gap-4">
      <h2 id="latest-order" className="text-xl">
        {t("profile.latest_order")}
      </h2>
      {isLoading ? (
        <Spinner className="size-5" />
      ) : !order || !style ? (
        <p className="text-sm text-muted-foreground">{t("orders.none")}</p>
      ) : (
        <LinkDynamic
          href={`/profile/orders/${order.id}`}
          className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border p-4 transition-colors hover:bg-muted"
        >
          <div className="min-w-48 flex-1">
            <p className="font-semibold text-heading">{t("profile.order_number", { id: order.id })}</p>
            <p className="text-sm text-muted-foreground">
              {format_order_date(order.created, i18n.language)} ·{" "}
              {t("orders.items", { count: order.item_count })}
            </p>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold", style.bg, style.text)}>
            {i18n.text(order.status_label)}
          </span>
          <span className="font-brand text-xl text-heading">
            {i18n.price(order.total, order.currency_code)}
          </span>
          <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
        </LinkDynamic>
      )}
    </section>
  );
}

function DefaultAddress() {
  const { t } = useI18n();
  const { data: addresses, isLoading } = useQuery(addresses_query());
  const { data: defaults } = useQuery(defaults_query());
  const address =
    addresses?.find((a) => a.address_id === defaults?.shipping_address) ?? addresses?.[0];

  return (
    <section aria-labelledby="default-address" className="surface flex flex-col gap-4">
      <h2 id="default-address" className="text-xl">
        {t("profile.default_address")}
      </h2>
      {isLoading ? (
        <Spinner className="size-5" />
      ) : address ? (
        <address className="text-sm not-italic text-heading">
          {address.firstname} {address.lastname}
          <br />
          {address.street}
          <br />
          {address.postcode} {address.city}, {address.country_code}
          <br />
          <span className="text-muted-foreground">
            {address.dialling_code} {address.telephone}
          </span>
        </address>
      ) : (
        <p className="text-sm text-muted-foreground">{t("profile.no_saved_addresses")}</p>
      )}
      <LinkDynamic href="/profile/addresses" className="link mt-auto text-sm font-semibold">
        {t("profile.manage_addresses")}{addresses?.length ? ` (${addresses.length})` : ""}
      </LinkDynamic>
    </section>
  );
}
