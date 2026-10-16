// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { MessageKey, Translate } from "@/lib/i18n/translate";
import type { CartError } from "@/utils/NORMALIZERS/cart.normalizer";

// Cart validation errors arrive as English text with a stable `code`. The code picks the message
// of the active language; an unknown code gets the generic one, never the raw API text.
const MESSAGE_BY_CODE: Record<string, MessageKey> = {
  ITEMS_QUANTITY_LIMITED_BY_STOCK: "cart.error_stock_limited",
  ITEM_QTY_CHANGED: "cart.error_stock_limited",
};

// One line per distinct message (the API repeats an error per item).
export function cart_error_texts(errors: CartError[], t: Translate): string[] {
  const texts = errors.map((e) => t(MESSAGE_BY_CODE[e.code] ?? "cart.error_generic"));
  return [...new Set(texts)];
}
