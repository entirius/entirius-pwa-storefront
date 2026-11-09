// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Which pickup points a shipping method delivers to. A method of type `inpost` or `pickup_point` asks for a point
// (Checkout v2: the other types deliver to the address); the API does not say which point types fit, so the
// storefront decides: InPost lockers for `inpost`, every type for `pickup_point`. A deployment names other types
// per method code in `DELIVERY_POINTS.TYPES_BY_METHOD` of _CONFIG/app.config.json.
const DEFAULT_TYPES: Record<string, string[]> = { inpost: ["inpost"], pickup_point: [] };

// null: the method delivers to the address. []: any point type. Else the type codes it takes.
export function point_types(
  method: { code: string; method_type: string | null },
  by_method: Record<string, string[]> = {},
): string[] | null {
  if (!method.method_type || !(method.method_type in DEFAULT_TYPES)) return null;
  return by_method[method.code] ?? DEFAULT_TYPES[method.method_type];
}

// The `type` query of `points/` takes one code: with several types the storefront asks for all and keeps its own.
export function type_query(types: string[]): { type?: string } {
  return types.length === 1 ? { type: types[0] } : {};
}

export function fits(point: { type_code: string | null }, types: string[]): boolean {
  return types.length === 0 || (point.type_code !== null && types.includes(point.type_code));
}
