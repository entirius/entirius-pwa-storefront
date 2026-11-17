// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { clamp_copies } from "./slot-config";

describe("clamp_copies", () => {
  it.each([
    [undefined, 1],
    [null, 1],
    [NaN, 1],
    ["garbage", 1],
    [0, 1],
    [-5, 1],
    [2.7, 2],
    ["3", 3],
    [8, 8],
    [1e9, 10],
    [Infinity, 10],
    [-Infinity, 1],
  ])("clamps %s to %s", (value, expected) => {
    expect(clamp_copies(value)).toBe(expected);
  });
});
