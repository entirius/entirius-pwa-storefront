// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { en } from "./messages/en";
import { pl } from "./messages/pl";
import { create_i18n } from "./translate";
import { price_lines } from "./price-lines";

const EN = create_i18n("en", en);
const PL = create_i18n("pl", { ...en, ...pl });

describe("price_lines", () => {
  it("formats a price in the active language", () => {
    expect(price_lines(EN, { gross: "549.00", currency: "EUR" })).toEqual(["€549.00"]);
    expect(price_lines(PL, { gross: "359.00", currency: "PLN" })).toEqual(["359,00\u00a0zł"]) // Intl puts a no-break space before the symbol;
  });

  it("gives the struck list price and the special price", () => {
    expect(price_lines(EN, { gross: "829.00", final_gross: "689.00", currency: "EUR" })).toEqual([
      "€829.00",
      "€689.00",
    ]);
  });

  it("says From for a range and Price on request without a price", () => {
    expect(price_lines(EN, { gross: "549.00", currency: "EUR", from: true })).toEqual(["From €549.00"]);
    expect(price_lines(PL, null)).toEqual(["Cena na zapytanie"]);
  });
});
