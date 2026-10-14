// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { afterEach, describe, expect, it, vi } from "vitest";
import { make_static_access } from "./access/api.static-access";
import { create_api } from "./api.context";
import { API_PRODUCTS_ROUTE } from "./api.routes";

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
