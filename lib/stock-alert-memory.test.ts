// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { afterEach, describe, expect, it, vi } from "vitest";
import { STOCK_ALERT_MEMORY_LIMIT, is_remembered, remember_sku, remembered_skus } from "./stock-alert-memory";

function memory_storage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  const storage = {
    getItem: (k: string) => items.get(k) ?? null,
    setItem: (k: string, v: string) => void items.set(k, v),
  };
  vi.stubGlobal("localStorage", storage);
  return items;
}

describe("stock alert memory", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("remembers a SKU per channel, once", () => {
    const items = memory_storage();
    remember_sku("eu", "TEE-M");
    remember_sku("eu", "TEE-M");
    remember_sku("us", "TEE-L");
    expect(is_remembered("eu", "TEE-M")).toBe(true);
    expect(is_remembered("eu", "TEE-L")).toBe(false);
    expect(JSON.parse(items.get("stock-alerts:eu")!)).toEqual(["TEE-M"]);
    expect(JSON.parse(items.get("stock-alerts:us")!)).toEqual(["TEE-L"]);
  });

  it("keeps the newest SKUs up to the limit and drops the oldest", () => {
    memory_storage();
    for (let i = 0; i <= STOCK_ALERT_MEMORY_LIMIT; i += 1) remember_sku("eu", `SKU-${i}`);
    const skus = remembered_skus("eu");
    expect(skus).toHaveLength(STOCK_ALERT_MEMORY_LIMIT);
    expect(skus[0]).toBe("SKU-1");
    expect(skus.at(-1)).toBe(`SKU-${STOCK_ALERT_MEMORY_LIMIT}`);
  });

  it("reads corrupted storage as empty and overwrites it", () => {
    const items = memory_storage({ "stock-alerts:eu": "{not json", "stock-alerts:us": '{"a":1}' });
    expect(remembered_skus("eu")).toEqual([]);
    expect(remembered_skus("us")).toEqual([]);
    remember_sku("eu", "TEE-M");
    expect(JSON.parse(items.get("stock-alerts:eu")!)).toEqual(["TEE-M"]);
  });

  it("drops non-string entries", () => {
    memory_storage({ "stock-alerts:eu": '["TEE-M", 3, null]' });
    expect(remembered_skus("eu")).toEqual(["TEE-M"]);
  });

  it("works without storage: nothing remembered, nothing thrown", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    expect(() => remember_sku("eu", "TEE-M")).not.toThrow();
    expect(is_remembered("eu", "TEE-M")).toBe(false);
  });

  it("works when localStorage is not defined at all", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(() => remember_sku("eu", "TEE-M")).not.toThrow();
    expect(remembered_skus("eu")).toEqual([]);
  });
});
