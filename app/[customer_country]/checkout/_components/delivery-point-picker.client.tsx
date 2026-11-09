// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { LocateFixed, Search } from "lucide-react";

import { make_client_access } from "@/API/access/api.client-access";
import { create_api } from "@/API/api.context";
import { API_DELIVERY_POINTS_NEARBY_ROUTE, API_DELIVERY_POINTS_ROUTE } from "@/API/api.routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError, FormHeading } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageLoading, Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { GOOGLE_MAPS } from "@/lib/delivery-points/config";
import { fits, type_query } from "@/lib/delivery-points/point-types";
import {
  NORM_DELIVERY_POINTS,
  point_address,
  to_cart_point,
  type CartDeliveryPoint,
  type DeliveryPoint,
} from "@/utils/NORMALIZERS/delivery-point.normalizer";
import { useI18n } from "@/providers/i18n.provider";

const DeliveryPointMap = dynamic(() => import("./delivery-point-map.client"), { ssr: false });

type Query = { kind: "search"; text: string } | { kind: "near"; lat: number; lng: number };

const PAGE_SIZE = 30;

// The pickup point of a shipping method that delivers to one (lib/delivery-points/point-types.ts). Points come from
// the backend (`deliverypoints/v2/`): a search by city, postal code or name, or the ones near the visitor. With a map
// configured, a map beside the list opens at the shipping address and searches the area it shows; without one the
// list starts with the shipping address's city.
export function DeliveryPointPicker({
  types,
  start,
  value,
  onChange,
}: {
  // [] = every type
  types: string[];
  start: { street: string | null; postcode: string | null; city: string | null };
  value: CartDeliveryPoint | null;
  onChange: (point: CartDeliveryPoint) => void;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const api = useMemo(() => create_api(make_client_access()), []);

  const first_text = start.city ?? start.postcode ?? "";
  const [text, setText] = useState(first_text);
  const [query, setQuery] = useState<Query | null>(first_text ? { kind: "search", text: first_text } : null);
  const [locating, setLocating] = useState(false);
  const [location_error, setLocationError] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");

  const types_key = types.join(",");
  const { data: points, isFetching, isError } = useQuery({
    queryKey: ["delivery-points", query, types_key],
    enabled: query !== null,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      if (!query) return [];
      const [error, response] =
        query.kind === "search"
          ? await api.FETCH_METHOD(API_DELIVERY_POINTS_ROUTE, {
              querys: { search: query.text, page_size: PAGE_SIZE, ...type_query(types) },
            })
          : await api.FETCH_METHOD(API_DELIVERY_POINTS_NEARBY_ROUTE, {
              querys: { lat: query.lat, lng: query.lng, ...type_query(types) },
            });
      if (error) throw new Error(error.message);
      return NORM_DELIVERY_POINTS(response).filter((p) => fits(p, types));
    },
  });

  const search = () => {
    const value_text = text.trim();
    if (value_text) setQuery({ kind: "search", text: value_text });
  };

  const near_me = () => {
    setLocationError(false);
    if (!("geolocation" in navigator)) {
      setLocationError(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        setQuery({ kind: "near", lat: coords.latitude, lng: coords.longitude });
      },
      () => {
        setLocating(false);
        setLocationError(true);
      },
      { timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const choose = (point: DeliveryPoint) => onChange(to_cart_point(point));
  const distance = (km: number) =>
    t("checkout.point_distance", {
      distance: new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(km),
    });

  const list = points ?? [];
  let results;
  if (query === null) {
    results = null;
  } else if (isError) {
    results = <FormError>{t("checkout.point_failed")}</FormError>;
  } else if (!points && isFetching) {
    results = <PageLoading className="min-h-32" />;
  } else if (list.length === 0) {
    results = <p className="text-sm text-muted-foreground">{t("checkout.point_none")}</p>;
  } else {
    results = (
      <RadioGroup
        aria-label={t("checkout.point_heading")}
        value={value?.code ?? ""}
        onValueChange={(code) => {
          const point = list.find((p) => p.code === code);
          if (point) choose(point);
        }}
        className={cn("max-h-96 gap-2 overflow-y-auto pr-1", isFetching && "opacity-60")}
      >
        {list.map((p) => (
          <label
            key={p.code}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
              value?.code === p.code ? "border-primary bg-primary/5" : "hover:bg-muted/50",
            )}
          >
            <RadioGroupItem value={p.code} className="mt-0.5" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-medium">{p.name}</span>
              <span className="text-muted-foreground">{point_address(p)}</span>
              {p.hint && <span className="text-xs text-muted-foreground">{p.hint}</span>}
              {p.opening_hours && <span className="text-xs text-muted-foreground">{p.opening_hours}</span>}
            </span>
            <span className="flex shrink-0 flex-col items-end gap-0.5 text-xs text-muted-foreground">
              {p.distance_km !== null && <span className="tabular-nums">{distance(p.distance_km)}</span>}
              {types.length !== 1 && p.type_name && <span>{p.type_name}</span>}
            </span>
          </label>
        ))}
      </RadioGroup>
    );
  }

  const address_line = [start.street, [start.postcode, start.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="surface-outline flex flex-col gap-4" aria-labelledby="delivery-point-heading">
      <FormHeading id="delivery-point-heading">{t("checkout.point_heading")}</FormHeading>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <Field id="delivery-point-search" label={t("checkout.point_search_label")} className="min-w-48 flex-1">
          <Input
            id="delivery-point-search"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
          />
        </Field>
        <Button type="submit" variant="outline">
          <Search className="size-4" aria-hidden />
          {t("checkout.point_search")}
        </Button>
        <Button type="button" variant="outline" onClick={near_me} disabled={locating}>
          {locating ? <Spinner className="size-4" /> : <LocateFixed className="size-4" aria-hidden />}
          {t("checkout.point_nearby")}
        </Button>
      </form>
      {location_error && <FormError>{t("checkout.point_location_denied")}</FormError>}

      {GOOGLE_MAPS && (
        <div className="flex gap-2 md:hidden">
          {(["list", "map"] as const).map((v) => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={view === v ? "default" : "outline"}
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {t(v === "list" ? "checkout.point_list" : "checkout.point_map")}
            </Button>
          ))}
        </div>
      )}

      <div className={cn(GOOGLE_MAPS && "grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]")}>
        <div className={cn(GOOGLE_MAPS && view === "map" && "hidden md:block")}>{results}</div>
        {GOOGLE_MAPS && (
          <div className={cn("min-h-72", view === "list" && "hidden md:block")}>
            <DeliveryPointMap
              maps={GOOGLE_MAPS}
              points={list}
              selected={value?.code ?? null}
              start_address={address_line || null}
              onSelect={choose}
              onArea={(center) => setQuery({ kind: "near", ...center })}
            />
          </div>
        )}
      </div>
    </section>
  );
}
