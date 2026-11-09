// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Pickup points of `deliverypoints/v2/{channel}/points/` (and `nearby/`), and the point a cart or an order keeps.

export type DeliveryPoint = {
  code: string;
  name: string;
  type_code: string | null;
  type_name: string | null;
  street: string | null;
  city: string | null;
  post_code: string | null;
  hint: string | null;
  opening_hours: string | null;
  lat: number | null;
  lng: number | null;
  // km, only in a `nearby/` answer
  distance_km: number | null;
};

// The point as `PATCH carts/{id}/shipping/` takes it (`delivery_point`) and the cart and the order give it back.
export type CartDeliveryPoint = {
  code: string;
  name: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
};

type RawPoint = {
  code?: unknown;
  name?: unknown;
  type_code?: unknown;
  type_name?: unknown;
  street?: unknown;
  city?: unknown;
  post_code?: unknown;
  hint?: unknown;
  opening_hours?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  distance?: unknown;
};

const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

function norm_point(raw: RawPoint): DeliveryPoint | null {
  const code = text(raw?.code);
  if (!code) return null;
  return {
    code,
    name: text(raw.name) ?? code,
    type_code: text(raw.type_code),
    type_name: text(raw.type_name),
    street: text(raw.street),
    city: text(raw.city),
    post_code: text(raw.post_code),
    hint: text(raw.hint),
    opening_hours: text(raw.opening_hours),
    lat: num(raw.latitude),
    lng: num(raw.longitude),
    distance_km: num(raw.distance),
  };
}

// `{ count, results }` (paginated) or a bare list; entries without a code drop.
export function NORM_DELIVERY_POINTS(resp: unknown): DeliveryPoint[] {
  const body = resp as { results?: unknown } | unknown[] | null;
  const list = Array.isArray(body) ? body : body && Array.isArray(body.results) ? body.results : [];
  return list.map((p) => norm_point(p as RawPoint)).filter((p): p is DeliveryPoint => p !== null);
}

export function to_cart_point(point: DeliveryPoint): CartDeliveryPoint {
  return {
    code: point.code,
    name: point.name,
    address: point.street,
    city: point.city,
    postcode: point.post_code,
  };
}

export function NORM_CART_POINT(raw: unknown): CartDeliveryPoint | null {
  const p = raw as { code?: unknown; name?: unknown; address?: unknown; city?: unknown; postcode?: unknown } | null;
  const code = text(p?.code);
  if (!code) return null;
  return { code, name: text(p?.name), address: text(p?.address), city: text(p?.city), postcode: text(p?.postcode) };
}

// "ul. Marszałkowska 10, 00-624 Warszawa"
export function point_address(p: { address?: string | null; street?: string | null; postcode?: string | null; post_code?: string | null; city?: string | null }): string {
  const town = [p.postcode ?? p.post_code, p.city].filter(Boolean).join(" ");
  return [p.address ?? p.street, town].filter(Boolean).join(", ");
}
