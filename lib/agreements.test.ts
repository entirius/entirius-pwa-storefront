// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it, vi } from "vitest";
import type { create_api } from "@/API/api.context";
import { record_order_agreements } from "./agreements";

type Api = ReturnType<typeof create_api>;
type Answer = Awaited<ReturnType<Api["FETCH_METHOD"]>>;

const ok: Answer = [undefined, { detail: "Order agreements recorded." }, { status: 201, headers: new Headers() }];
const failed = (status: number): Answer => [{ message: "x", status }, undefined, { status, headers: new Headers() }];

function api_answering(...answers: Answer[]) {
  const FETCH_METHOD = vi.fn();
  for (const a of answers) FETCH_METHOD.mockResolvedValueOnce(a);
  return { api: { FETCH_METHOD } as unknown as Api, FETCH_METHOD };
}

const order = { order_id: "48394e67-2577-4db1-9ec3-d1b996b2b802", email: "a@example.com", slugs: ["terms-of-service"], language: "en" };

describe("record_order_agreements", () => {
  it("posts the slugs for the order", async () => {
    const { api, FETCH_METHOD } = api_answering(ok);
    expect(await record_order_agreements(api, order)).toBe(true);
    const [, init] = FETCH_METHOD.mock.calls[0];
    expect(init.suffix).toEqual([order.order_id, "agreements"]);
    expect(JSON.parse(init.body)).toEqual({ email: "a@example.com", slugs: ["terms-of-service"], language: "en" });
  });

  it("tries a failed call once more: a repeat records nothing new", async () => {
    const { api, FETCH_METHOD } = api_answering(failed(503), ok);
    expect(await record_order_agreements(api, order)).toBe(true);
    expect(FETCH_METHOD).toHaveBeenCalledTimes(2);
  });

  it("does not retry what another try cannot fix", async () => {
    for (const status of [400, 401, 404]) {
      const { api, FETCH_METHOD } = api_answering(failed(status), ok);
      expect(await record_order_agreements(api, order)).toBe(false);
      expect(FETCH_METHOD).toHaveBeenCalledTimes(1);
    }
  });

  it("sends nothing without an order, an email or a slug", async () => {
    const { api, FETCH_METHOD } = api_answering(ok);
    expect(await record_order_agreements(api, { ...order, email: "" })).toBe(false);
    expect(await record_order_agreements(api, { ...order, slugs: [] })).toBe(false);
    expect(FETCH_METHOD).not.toHaveBeenCalled();
  });
});
