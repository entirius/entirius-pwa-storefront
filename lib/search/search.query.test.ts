// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { NORM_SEARCH_DATA, product_href } from "./search.query";

const media = (...widths: number[]) => ({
  position: 0,
  source_set: widths.map((width) => ({ source: `/m/${width}.jpg`, width, height: width })),
});

const item = (extra: object = {}) => ({ sku: "S", name: "Chair", url_key: "chair", ...extra });

describe("NORM_SEARCH_DATA", () => {
  it("reads the products/ shape: price object, main_image dict", () => {
    const { products } = NORM_SEARCH_DATA({
      products: {
        total: 1,
        results: [
          item({
            price: { currency: "EUR", gross: "100.00", final_gross: "80.00", has_special_price: true, percent_off: "20" },
            main_image: media(160, 320),
          }),
        ],
      },
    });
    const [p] = products?.results ?? [];
    expect(p.price).toEqual({ gross: "100.00", currency: "EUR", final_gross: "80.00" });
    expect(p.percent_off).toBe("20");
    expect(p.media[0].map((m) => m.uri)).toContainEqual(expect.stringMatching(/\/m\/320\.jpg$/));
    expect(p.href).toBe("/product/chair");
  });

  it("shows a configurable product as a From price", () => {
    const { products } = NORM_SEARCH_DATA({
      products: {
        results: [item({ price: { currency: "EUR", is_range: true, range_from_gross: "49.00", range_from_special_gross: "39.00" } })],
      },
    });
    expect(products?.results?.[0].price).toEqual({ gross: "49.00", currency: "EUR", from: true, final_gross: "39.00" });
  });

  it("has no price and the placeholder without price and picture", () => {
    const { products } = NORM_SEARCH_DATA({ products: { results: [item({ price: null, main_image: null })] } });
    const [p] = products?.results ?? [];
    expect(p.price).toBeNull();
    expect(p.media.flat().every((m) => m.uri === "/placeholder.svg")).toBe(true);
  });

  it("keeps total, categories and phrases", () => {
    const raw = { products: { total: 3, results: [] }, categories: { results: [{ url_key: "c" }] }, phrases: [{ text: "a", type: "completion" }] };
    const data = NORM_SEARCH_DATA(raw);
    expect(data.products?.total).toBe(3);
    expect(data.categories).toEqual(raw.categories);
    expect(data.phrases).toEqual(raw.phrases);
  });

  it("answers an empty response", () => {
    expect(NORM_SEARCH_DATA(undefined)).toEqual({});
  });
});

describe("product_href", () => {
  it("links a product to its page", () => {
    expect(product_href({ sku: "S", url_key: "chair" })).toBe("/product/chair");
  });

  it("links a variant to its parent with the variant chosen", () => {
    expect(product_href({ sku: "S 1", url_key: null as unknown as string, parent_url_key: "set" })).toBe("/product/set?variant=S%201");
  });
});
