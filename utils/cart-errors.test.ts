// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { cart_error_texts } from "./cart-errors";

const t = ((key: string) => `[${key}]`) as Parameters<typeof cart_error_texts>[1];
const error = (code: string, message = "English text from the API") => ({ code, message, sku: null });

describe("cart_error_texts", () => {
  it("maps a known code to its message and never shows the API text", () => {
    expect(cart_error_texts([error("ITEMS_QUANTITY_LIMITED_BY_STOCK")], t)).toEqual(["[cart.error_stock_limited]"]);
  });

  it("gives an unknown code the generic message", () => {
    expect(cart_error_texts([error("SOMETHING_NEW")], t)).toEqual(["[cart.error_generic]"]);
  });

  it("returns one line per distinct message", () => {
    const errors = [error("ITEM_QTY_CHANGED"), error("ITEMS_QUANTITY_LIMITED_BY_STOCK"), error("OTHER")];
    expect(cart_error_texts(errors, t)).toEqual(["[cart.error_stock_limited]", "[cart.error_generic]"]);
  });
});
