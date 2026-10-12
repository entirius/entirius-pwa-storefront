// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Price } from "@/utils/NORMALIZERS/price.normalizer";
import type { I18n } from "./translate";

// [list price] or, when a special price applies, [struck list price, special price].
// No price → one line "Price on request"; a CONFIGURABLE range → "From X".
export function price_lines(i18n: Pick<I18n, "t" | "price">, price: Price | null): string[] {
  if (!price) return [i18n.t("product.price_on_request")];
  const text = (amount: string) => {
    const formatted = i18n.price(amount, price.currency);
    return price.from ? i18n.t("product.price_from_amount", { price: formatted }) : formatted;
  };
  return price.final_gross ? [text(price.gross), text(price.final_gross)] : [text(price.gross)];
}
