// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

/// <reference types="google.maps" />

"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { load_google_maps } from "@/lib/delivery-points/google-maps";
import type { DeliveryPoint } from "@/utils/NORMALIZERS/delivery-point.normalizer";
import { useI18n } from "@/providers/i18n.provider";

type LatLng = { lat: number; lng: number };

// Warsaw: where the map opens before the shipping address is found.
const FALLBACK_CENTER: LatLng = { lat: 52.2297, lng: 21.0122 };

// The map of the pickup point picker (next/dynamic, only with a configured key). The list beside it stays the way
// to choose a point with a keyboard or a screen reader; a marker does the same as its row. The map opens at the
// shipping address (geocoded once) and reports that place as the area to search.
export default function DeliveryPointMap({
  maps,
  points,
  selected,
  start_address,
  onSelect,
  onArea,
}: {
  maps: { key: string; map_id: string };
  points: DeliveryPoint[];
  selected: string | null;
  start_address: string | null;
  onSelect: (point: DeliveryPoint) => void;
  onArea: (center: LatLng) => void;
}) {
  const { t, language } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // The latest callbacks, so the map's listeners need no rebuilding when the parent renders.
  const on_select = useRef(onSelect);
  const on_area = useRef(onArea);
  useEffect(() => {
    on_select.current = onSelect;
    on_area.current = onArea;
  });

  useEffect(() => {
    let cancelled = false;
    load_google_maps(maps.key, language)
      .then(async (api) => {
        const { Map } = (await api.importLibrary("maps")) as google.maps.MapsLibrary;
        if (cancelled || !box.current) return;
        map.current = new Map(box.current, {
          mapId: maps.map_id,
          center: FALLBACK_CENTER,
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "cooperative",
        });
        setReady(true);
        if (!start_address) return;
        const { Geocoder } = (await api.importLibrary("geocoding")) as google.maps.GeocodingLibrary;
        const { results } = await new Geocoder().geocode({ address: start_address });
        const place = results[0]?.geometry.location;
        if (cancelled || !place || !map.current) return;
        map.current.setCenter(place);
        on_area.current({ lat: place.lat(), lng: place.lng() });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [maps.key, maps.map_id, language, start_address]);

  // One marker per point with coordinates; the selected one stands out. A new list moves the map onto it.
  useEffect(() => {
    if (!ready || !map.current) return;
    let cancelled = false;
    (async () => {
      const { AdvancedMarkerElement } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;
      if (cancelled || !map.current) return;
      for (const marker of markers.current) marker.map = null;
      const placed = points.filter((p) => p.lat !== null && p.lng !== null);
      markers.current = placed.map((point) => {
        const dot = document.createElement("span");
        dot.className = cn(
          "block size-4 rounded-full border-2 border-card shadow-sm",
          point.code === selected ? "size-5 bg-highlight ring-2 ring-primary" : "bg-primary",
        );
        const marker = new AdvancedMarkerElement({
          map: map.current,
          position: { lat: point.lat as number, lng: point.lng as number },
          title: t("checkout.point_on_map", { name: point.name }),
          content: dot,
          gmpClickable: true,
        });
        marker.addListener("gmp-click", () => on_select.current(point));
        return marker;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, points, selected, t]);

  useEffect(() => {
    if (!ready || !map.current) return;
    const placed = points.filter((p) => p.lat !== null && p.lng !== null);
    if (!placed.length) return;
    const bounds = new google.maps.LatLngBounds();
    for (const p of placed) bounds.extend({ lat: p.lat as number, lng: p.lng as number });
    map.current.fitBounds(bounds, 48);
    if (placed.length === 1) map.current.setZoom(15);
  }, [ready, points]);

  if (failed) return null;

  return (
    <div className="relative h-full min-h-72 overflow-hidden rounded-lg border border-border">
      <div ref={box} className="absolute inset-0" />
      {ready && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-card shadow-sm"
          onClick={() => {
            const center = map.current?.getCenter();
            if (center) on_area.current({ lat: center.lat(), lng: center.lng() });
          }}
        >
          <Search className="size-4" aria-hidden />
          {t("checkout.point_area")}
        </Button>
      )}
    </div>
  );
}
