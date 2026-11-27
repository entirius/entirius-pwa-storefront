// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it, vi } from "vitest";
import type { create_api } from "@/API/api.context";
import { record_order_agreements } from "./agreements";
import { agreement_context_query } from "./agreements.query";

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

describe("agreement_context_query", () => {
  it("asks for the definitions of one context and normalizes the answer", async () => {
    const results = [{ slug: "terms-of-service", category: "mandatory", summary: "Terms", sort_order: 1 }];
    const { api, FETCH_METHOD } = api_answering([undefined, { count: 1, results }, { status: 200, headers: new Headers() }]);
    const query = agreement_context_query(api, "en", "checkout");
    expect(query.queryKey).toEqual(["agreement-definitions", "en", "checkout"]);
    expect((await query.queryFn()).map((d) => d.slug)).toEqual(["terms-of-service"]);
    expect(FETCH_METHOD.mock.calls[0][1]).toEqual({ querys: { context: "checkout" } });
  });

  it("fails on an error, so the form falls back to the shop's own wording", async () => {
    const { api } = api_answering(failed(404));
    await expect(agreement_context_query(api, "en", "registration").queryFn()).rejects.toThrow();
  });
});
