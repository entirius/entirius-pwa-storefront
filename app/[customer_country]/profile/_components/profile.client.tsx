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
import { profile_query } from "../api.query";
import { orders_query } from "../orders/api.query";
import { addresses_query, defaults_query } from "../addresses/api.query";
import { ProfileEditForm } from "./profile-edit-form";

// Account overview: details (editable), the latest order, the default address.
export function ProfileClient() {
  const queryClient = useQueryClient();
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
        <h1 className="text-4xl">My account</h1>
        <p className="mt-1 text-muted-foreground">
          Your orders, addresses and account details in one place.
        </p>
      </div>

      <LatestOrder />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="account-details" className="flex flex-col gap-4 rounded-3xl bg-card p-6">
          <h2 id="account-details" className="text-xl">
            Account details
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
                className="self-start rounded-full"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            </>
          )}
        </section>
        <DefaultAddress />
      </div>
    </div>
  );
}

function LatestOrder() {
  const { data, isLoading } = useInfiniteQuery(orders_query());
  const order = data?.pages[0]?.orders[0];
  const style = order ? status_style(order.status) : null;

  return (
    <section aria-labelledby="latest-order" className="flex flex-col gap-4 rounded-3xl bg-card p-6">
      <h2 id="latest-order" className="text-xl">
        Latest order
      </h2>
      {isLoading ? (
        <Spinner className="size-5" />
      ) : !order || !style ? (
        <p className="text-sm text-muted-foreground">You haven&apos;t placed any orders yet.</p>
      ) : (
        <LinkDynamic
          href={`/profile/orders/${order.id}`}
          className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border p-4 transition-colors hover:bg-muted"
        >
          <div className="min-w-48 flex-1">
            <p className="font-semibold text-heading">Order {order.id}</p>
            <p className="text-sm text-muted-foreground">
              {format_order_date(order.created)} · {order.item_count}{" "}
              {order.item_count === 1 ? "item" : "items"}
            </p>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold", style.bg, style.text)}>
            {order.status_label || order.status}
          </span>
          <span className="font-brand text-xl text-heading">
            {order.total} {order.currency_code}
          </span>
          <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
        </LinkDynamic>
      )}
    </section>
  );
}

function DefaultAddress() {
  const { data: addresses, isLoading } = useQuery(addresses_query());
  const { data: defaults } = useQuery(defaults_query());
  const address =
    addresses?.find((a) => a.address_id === defaults?.shipping_address) ?? addresses?.[0];

  return (
    <section aria-labelledby="default-address" className="flex flex-col gap-4 rounded-3xl bg-card p-6">
      <h2 id="default-address" className="text-xl">
        Default address
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
        <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
      )}
      <LinkDynamic href="/profile/addresses" className="link mt-auto text-sm font-semibold">
        Manage addresses{addresses?.length ? ` (${addresses.length})` : ""}
      </LinkDynamic>
    </section>
  );
}
