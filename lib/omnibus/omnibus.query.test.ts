// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { is_discounted, omnibus_prefetch, omnibus_query } from "./omnibus.query";

type Call = { path: string; options: { querys: { sku: string[] } } };

// Fake fetch engine: records calls, answers with a dict keyed by SKU.
function fake_api(dict: Record<string, unknown>) {
  const calls: Call[] = [];
  const api = {
    FETCH_METHOD: async (path: string, options: Call["options"]) => {
      calls.push({ path, options });
      return [undefined, dict, {}];
    },
  };
  return { api: api as never, calls };
}

describe("is_discounted", () => {
  it("follows the same rule as the displayed price", () => {
    expect(is_discounted({ has_special_price: true, final_gross: "689.00" })).toBe(true);
    expect(is_discounted({ has_special_price: true, final_gross: null })).toBe(false);
    expect(is_discounted({ is_range: true, range_from_special_gross: "499.00" })).toBe(true);
    expect(is_discounted({ is_range: true })).toBe(false);
    expect(is_discounted(null)).toBe(false);
  });
});

describe("omnibus_query", () => {
  it("batches SKUs asked for in the same tick into one request", async () => {
    const { api, calls } = fake_api({
      A: { currency: "EUR", omnibus_gross: "10.00" },
      B: { currency: "EUR", omnibus_gross: "20.00" },
    });
    const [a, b, missing] = await Promise.all([
      omnibus_query(api, "A").queryFn(),
      omnibus_query(api, "B").queryFn(),
      omnibus_query(api, "C").queryFn(),
    ]);
    expect(calls).toHaveLength(1);
    expect(calls[0].options.querys.sku).toEqual(["A", "B", "C"]);
    expect(a).toEqual({ gross: "10.00", currency: "EUR" });
    expect(b).toEqual({ gross: "20.00", currency: "EUR" });
    expect(missing).toBeNull();
  });
});

describe("omnibus_prefetch", () => {
  it("fetches once and seeds one cache entry per SKU", async () => {
    const { api, calls } = fake_api({ A: { currency: "EUR", omnibus_gross: "10.00" } });
    const entry = omnibus_prefetch(api, ["B", "A", "A"]);
    expect(entry.queryKey).toEqual(["omnibus-batch", ["A", "B"]]);
    const result = await entry.queryFn();
    const client = new QueryClient();
    entry.seed(result, client);
    expect(calls).toHaveLength(1);
    expect(client.getQueryData(["omnibus", "A"])).toEqual({ gross: "10.00", currency: "EUR" });
    expect(client.getQueryData(["omnibus", "B"])).toBeNull();
  });

  it("does not seed after a failed prefetch, so the browser asks again", () => {
    const client = new QueryClient();
    omnibus_prefetch(fake_api({}).api, ["A"]).seed(undefined, client);
    expect(client.getQueryData(["omnibus", "A"])).toBeUndefined();
  });
});
