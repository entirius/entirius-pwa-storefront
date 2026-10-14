// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import channels from "@/_CONFIG/channels.config.json";
import countries from "@/_CONFIG/countries.config.json";
import geo_CF_helper from "./cookies-setter.helper";

const request = (cookie: string) => new NextRequest("http://shop.test/default/cart", { headers: { cookie } });
const DEFAULT_CHANNEL = (countries as Record<string, { default_channel: string }>).default.default_channel;

describe("geo_CF_helper channel", () => {
  it("keeps a channel the shop serves", () => {
    const served = Object.keys(channels)[0];
    expect(geo_CF_helper(request(`ct=default; ch=${served}`)).ch).toBe(served);
  });

  it("replaces an unknown or forged channel with the profile's default", () => {
    expect(geo_CF_helper(request("ct=default; ch=no-such-channel")).ch).toBe(DEFAULT_CHANNEL);
    expect(geo_CF_helper(request("ct=default; ch=../../admin")).ch).toBe(DEFAULT_CHANNEL);
  });
});
