// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { decode_param } from "./route-params";

describe("decode_param", () => {
  it("decodes a percent-encoded segment", () => {
    expect(decode_param("rega%C5%82-gwiezdny")).toBe("regał-gwiezdny");
  });

  it("leaves a decoded segment as it is", () => {
    expect(decode_param("regał-gwiezdny")).toBe("regał-gwiezdny");
    expect(decode_param("star-chart-bookshelf")).toBe("star-chart-bookshelf");
  });

  it("keeps a malformed escape", () => {
    expect(decode_param("bad%E0%A4%A")).toBe("bad%E0%A4%A");
  });
});
