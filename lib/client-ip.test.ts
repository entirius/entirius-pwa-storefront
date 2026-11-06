// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { client_ip } from "./client-ip";

const headers = (entries: Record<string, string>) => new Headers(entries);

describe("client_ip", () => {
  it("reads the configured header", () => {
    expect(client_ip(headers({ "cf-connecting-ip": "203.0.113.7" }), "cf-connecting-ip")).toBe("203.0.113.7");
    expect(client_ip(headers({ "x-real-ip": "2001:db8::1" }), "x-real-ip")).toBe("2001:db8::1");
  });

  it("sends nothing without a configured header, whatever the visitor sends", () => {
    const sent = headers({ "x-client-ip": "198.51.100.1", "x-forwarded-for": "198.51.100.1" });
    expect(client_ip(sent, null)).toBeNull();
    expect(client_ip(sent, undefined)).toBeNull();
    expect(client_ip(sent, "")).toBeNull();
  });

  it("is null when the configured header is missing or holds no address", () => {
    expect(client_ip(headers({}), "cf-connecting-ip")).toBeNull();
    expect(client_ip(headers({ "cf-connecting-ip": "unknown" }), "cf-connecting-ip")).toBeNull();
    expect(client_ip(headers({ "cf-connecting-ip": " " }), "cf-connecting-ip")).toBeNull();
  });

  it("takes the last entry of a list: the address the closest proxy saw", () => {
    const sent = headers({ "x-forwarded-for": "198.51.100.1, 203.0.113.7" });
    expect(client_ip(sent, "x-forwarded-for")).toBe("203.0.113.7");
  });

  it("drops the port of an IPv4 address", () => {
    expect(client_ip(headers({ "x-forwarded-for": "203.0.113.7:51234" }), "x-forwarded-for")).toBe("203.0.113.7");
  });
});
