// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { cart_query } from "./cart.query";
import type { CartItem } from "./cart.store";
import type { COOKIE_ACCESS } from "@/API/api";
import type { create_api } from "@/API/api.context";

const items: Record<string, CartItem> = {
  A: {
    sku: "A",
    name: "Product A",
    url_key: "a",
    price: { gross: "10.00", currency: "EUR" },
    media: [],
    quantity: 2,
  },
};

const fetch_method = vi.fn();
const api = { FETCH_METHOD: fetch_method } as unknown as ReturnType<typeof create_api>;

const make_access = (cid: string | undefined) => {
  const cookies = new Map<string, string>(cid ? [["cid", cid]] : []);
  return {
    cookies,
    access: {
      get: (key: string) => cookies.get(key),
      set: (key: string, value: string) => void cookies.set(key, value),
      delete: (key: string) => void cookies.delete(key),
    } as unknown as COOKIE_ACCESS,
  };
};

const run = (access: COOKIE_ACCESS) => {
  const query = cart_query(api, access, items, "EUR", null);
  return query.queryFn();
};

describe("cart_query", () => {
  beforeEach(() => fetch_method.mockReset());

  it("drops a stale cid on a 404 and creates a new cart", async () => {
    fetch_method
      .mockResolvedValueOnce([{ status: 404, message: "Not found" }, null])
      .mockResolvedValueOnce([null, { cart_id: "new-cart" }]);
    const { access, cookies } = make_access("old-cart");

    const cart = await run(access);

    expect(fetch_method.mock.calls.map(([, init]) => init.method)).toEqual(["PATCH", "POST"]);
    expect(cookies.get("cid")).toBe("new-cart");
    expect(cart?.cart_id).toBe("new-cart");
  });

  it("keeps the cid and throws on any other error", async () => {
    fetch_method.mockResolvedValueOnce([{ status: 500, message: "Server error" }, null]);
    const { access, cookies } = make_access("old-cart");

    await expect(run(access)).rejects.toThrow("Server error");

    expect(fetch_method).toHaveBeenCalledTimes(1);
    expect(cookies.get("cid")).toBe("old-cart");
  });

  it("throws when the new cart cannot be created after a 404", async () => {
    fetch_method
      .mockResolvedValueOnce([{ status: 404, message: "Not found" }, null])
      .mockResolvedValueOnce([{ status: 500, message: "Server error" }, null]);
    const { access, cookies } = make_access("old-cart");

    await expect(run(access)).rejects.toThrow("Server error");

    expect(cookies.has("cid")).toBe(false);
  });

  it("keeps the cid when the PATCH succeeds", async () => {
    fetch_method.mockResolvedValueOnce([null, { cart_id: "old-cart" }]);
    const { access, cookies } = make_access("old-cart");

    await run(access);

    expect(fetch_method).toHaveBeenCalledTimes(1);
    expect(cookies.get("cid")).toBe("old-cart");
  });
});
