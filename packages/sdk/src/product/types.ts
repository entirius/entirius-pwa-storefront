// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// The shapes a theme renders. The core's normalizers produce them from the API; a theme never sees raw API data.

// Amounts stay raw strings; the text is made at render time by price_lines() (@entirius/storefront-sdk/i18n/price-lines),
// so the active language decides the separators, the currency symbol and the "From" / "Price on request" words.
export type Price = {
  gross: string;
  currency: string;
  // Only present when a special price applies.
  final_gross?: string;
  // CONFIGURABLE: `gross` is the lowest price of its variants ("From X").
  from?: true;
};

export type MediaSource = { uri: string; width: number; height: number };
// Every picture in its sizes; a component shows the first one.
export type ProductMedia = MediaSource[][];

export type ProductBadge = { idx: string; name: string };

export type SpecRow = {
  idx: string | null;
  name: string;
  value: string;
  parts: { label: string; value_idx: string | null }[];
};

export type SpecGroup = {
  name: string | null; // null: attributes without a group
  rows: SpecRow[];
};

export type Story = { idx: string; name: string; html: string };

// color_hash: "#RGB" / "#RRGGBB" from the option's extension, null for a pattern or a text option.
export type VariantOption = { value: string; label: string; color_hash: string | null };

// One axis of a configurable product (size, colour, ...). Feature names come from the backend.
// swatch: the API's widget_type is "Swatch_Visual" (colours), so options with a color_hash draw as swatches.
export type VariantAxis = { idx: string; label: string; swatch: boolean; options: VariantOption[] };

export type WishlistItem = {
  sku: string;
  name: string;
  url_key: string;
  price: Price | null;
  // Missing on items saved before the type was kept.
  product_type?: string;
  description: string;
  media: ProductMedia;
};
