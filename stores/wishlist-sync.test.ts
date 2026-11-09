// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { beforeEach, describe, expect, it, vi } from "vitest";

// The stores persist to localStorage, which the node environment lacks.
vi.hoisted(() => {
  const data = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: () => null,
    length: 0,
  };
});
const fetch_method = vi.hoisted(() => vi.fn());
vi.mock("@/API/api.context", () => ({ create_api: () => ({ FETCH_METHOD: fetch_method }) }));
vi.mock("@/API/access/api.client-access", () => ({ make_client_access: () => ({}) }));

import { useWishlistStore, type WishlistItem } from "./wishlist.store";
import { useNotices } from "./notices.store";
import { merge_wishlist, toggle_on_account } from "./wishlist-sync";

const item = (sku: string, name = sku): WishlistItem => ({
  sku,
  name,
  url_key: sku.toLowerCase(),
  price: null,
  description: "",
  media: [],
});

describe("merge_wishlist", () => {
  it("follows the account and reuses local snapshots", () => {
    const local = { A: item("A", "local A"), B: item("B") };
    const merged = merge_wishlist(local, ["C", "A"], { C: item("C") }, false);
    expect(Object.keys(merged)).toEqual(["C", "A"]);
    expect(merged.A.name).toBe("local A");
    // B was removed on another device.
    expect(merged.B).toBeUndefined();
  });

  it("keeps the device's items at sign-in", () => {
    const merged = merge_wishlist({ B: item("B") }, ["A"], { A: item("A") }, true);
    expect(Object.keys(merged)).toEqual(["A", "B"]);
  });

  it("drops an account SKU the catalogue no longer has", () => {
    expect(merge_wishlist({}, ["GONE"], {}, false)).toEqual({});
  });
});

describe("toggle_on_account", () => {
  const refused = [{ status: 500, message: "refused" }];

  beforeEach(() => {
    useWishlistStore.setState({ items: {} });
    useNotices.setState({ notices: [] });
    fetch_method.mockReset();
  });

  it("undoes a refused save even when a sync replaced the list meanwhile", async () => {
    let answer!: (value: unknown) => void;
    fetch_method.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const saving = toggle_on_account("A", item("A"));
    expect(useWishlistStore.getState().has("A")).toBe(true);
    // The page-load sync lands first, with the account's list, which has no A yet.
    useWishlistStore.getState().replace({});
    answer(refused);
    expect(await saving).toBe(false);
    expect(useWishlistStore.getState().has("A")).toBe(false);
    expect(useNotices.getState().notices.map((n) => n.message)).toEqual(["wishlist.update_failed"]);
  });

  it("puts back an item whose removal the account refuses", async () => {
    useWishlistStore.setState({ items: { A: item("A") } });
    fetch_method.mockResolvedValue(refused);
    expect(await toggle_on_account("A", item("A"))).toBe(false);
    expect(useWishlistStore.getState().has("A")).toBe(true);
  });

  it("keeps a save the account takes, without a notice", async () => {
    fetch_method.mockResolvedValue([null, {}]);
    expect(await toggle_on_account("A", item("A"))).toBe(true);
    expect(useWishlistStore.getState().has("A")).toBe(true);
    expect(useNotices.getState().notices).toEqual([]);
  });
});
