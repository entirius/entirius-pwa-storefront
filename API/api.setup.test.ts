// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { afterEach, describe, expect, it, vi } from "vitest";
import { make_static_access } from "./access/api.static-access";
import { create_api } from "./api.context";
import {
  API_CART_LATEST_ROUTE,
  API_CART_ORDERS_ROUTE,
  API_CATEGORIES_ROUTE,
  API_CHECKOUT_COUNTRIES_ROUTE,
  API_CMS_BLOG_AUTHORS_ROUTE,
  API_CMS_FOOTER_ROUTE,
  API_PRODUCTS_ROUTE,
  API_STOCK_ROUTE,
  API_USER_PASSWORD_RESET_ROUTE,
  SHARED_CACHE_SECONDS,
} from "./api.routes";

describe("FETCH_METHOD path placeholders", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps a forged cookie value inside its path segment", async () => {
    const fetch = vi.fn<(url: string | URL) => Promise<Response>>(async () => Response.json({ results: [] }));
    vi.stubGlobal("fetch", fetch);
    const api = create_api(make_static_access({ channel: "../../admin", language: "en" }));
    await api.FETCH_METHOD(API_PRODUCTS_ROUTE, { querys: { page_size: "1" } });
    expect(String(fetch.mock.calls[0][0])).toContain("/api/matrix/v2/..%2F..%2Fadmin/products/?");
  });
});

describe("FETCH_METHOD shared cache", () => {
  afterEach(() => vi.unstubAllGlobals());

  type Init = RequestInit & { next?: { revalidate?: number } };
  const capture = () => {
    const fetch = vi.fn<(url: string | URL, init?: Init) => Promise<Response>>(async () => Response.json({ results: [] }));
    vi.stubGlobal("fetch", fetch);
    return fetch;
  };
  const shared = (init?: Init) => init?.next?.revalidate === SHARED_CACHE_SECONDS;

  it("caches an allowlisted GET under a URL that names the channel and the language", async () => {
    const fetch = capture();
    for (const [channel, language] of [["a", "pl"], ["a", "en"], ["b", "pl"]]) {
      await create_api(make_static_access({ channel, language })).FETCH_METHOD(API_CATEGORIES_ROUTE);
    }
    const urls = fetch.mock.calls.map(([url]) => String(url));
    expect(urls[0]).toMatch(/\/matrix\/v2\/a\/categories\/\?.*language=pl/);
    expect(urls[1]).toMatch(/\/matrix\/v2\/a\/categories\/\?.*language=en/);
    expect(urls[2]).toMatch(/\/matrix\/v2\/b\/categories\/\?.*language=pl/);
    expect(new Set(urls).size).toBe(3);
    expect(fetch.mock.calls.every(([, init]) => shared(init))).toBe(true);
  });

  it("caches the CMS footer", async () => {
    const fetch = capture();
    await create_api(make_static_access({})).FETCH_METHOD(API_CMS_FOOTER_ROUTE);
    expect(shared(fetch.mock.calls[0][1])).toBe(true);
  });

  it("never caches a route outside the allowlist", async () => {
    const fetch = capture();
    const api = create_api(make_static_access({ channel: "a", language: "pl" }));
    for (const route of [API_PRODUCTS_ROUTE, API_STOCK_ROUTE, API_CART_LATEST_ROUTE, API_CHECKOUT_COUNTRIES_ROUTE]) {
      await api.FETCH_METHOD(route);
    }
    expect(fetch.mock.calls.length).toBe(4);
    expect(fetch.mock.calls.some(([, init]) => init?.next)).toBe(false);
  });

  it("never caches an allowlisted route asked with credentials, another method or a cache mode", async () => {
    const fetch = capture();
    const api = create_api(make_static_access({ channel: "a", language: "pl" }));
    await api.FETCH_METHOD(API_CATEGORIES_ROUTE, { headers: { Authorization: "Bearer t" } });
    await api.FETCH_METHOD(API_CATEGORIES_ROUTE, { headers: { Cookie: "at=t" } });
    await api.FETCH_METHOD(API_CATEGORIES_ROUTE, { method: "POST" });
    await api.FETCH_METHOD(API_CATEGORIES_ROUTE, { cache: "no-store" });
    expect(fetch.mock.calls.some(([, init]) => init?.next)).toBe(false);
  });
});

describe("FETCH_METHOD suffix", () => {
  afterEach(() => vi.unstubAllGlobals());

  type Init = RequestInit & { headers?: Record<string, string>; next?: { revalidate?: number } };
  const capture = () => {
    const fetch = vi.fn<(url: string | URL, init?: Init) => Promise<Response>>(async () => Response.json({}));
    vi.stubGlobal("fetch", fetch);
    return fetch;
  };
  const api = () => create_api(make_static_access({ channel: "a", language: "pl" }));

  it("appends the call's segments after the route, each encoded as one segment, under the route's policy", async () => {
    const fetch = capture();
    await api().FETCH_METHOD(API_USER_PASSWORD_RESET_ROUTE, { method: "POST", suffix: ["k/../x y"] });
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toMatch(/\/customer\/password\/reset\/k%2F..%2Fx%20y\/$/);
    expect(init?.headers?.["Content-Type"]).toBe("application/json");
  });

  it("joins several segments and keeps the route's default query", async () => {
    const fetch = capture();
    await api().FETCH_METHOD(API_PRODUCTS_ROUTE, { suffix: ["sofa", "variants"] });
    expect(String(fetch.mock.calls[0][0])).toMatch(/\/matrix\/v2\/a\/products\/sofa\/variants\/\?.*language=pl/);
  });

  it("caches a shared route per segment", async () => {
    const fetch = capture();
    await api().FETCH_METHOD(API_CMS_BLOG_AUTHORS_ROUTE, { suffix: ["anna"] });
    await api().FETCH_METHOD(API_CMS_BLOG_AUTHORS_ROUTE, { suffix: ["jan"] });
    const urls = fetch.mock.calls.map(([url]) => String(url));
    expect(urls[0]).toMatch(/\/authors\/anna\/\?channel=a$/);
    expect(urls[1]).toMatch(/\/authors\/jan\/\?channel=a$/);
    expect(fetch.mock.calls.every(([, init]) => init?.next?.revalidate === SHARED_CACHE_SECONDS)).toBe(true);
  });

  it("fails an empty segment instead of asking the route itself (the order list for an order)", async () => {
    const fetch = capture();
    const [error] = await api().FETCH_METHOD(API_CART_ORDERS_ROUTE, { suffix: [""] });
    expect(error?.message).toBe("empty-route-suffix");
    expect(fetch).not.toHaveBeenCalled();
  });
});
