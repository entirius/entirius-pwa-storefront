// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { google_maps } from "./config";

describe("google_maps", () => {
  it("needs both the key and the map ID", () => {
    expect(google_maps({ GOOGLE_MAPS_API_KEY: "key", GOOGLE_MAPS_MAP_ID: "map" })).toEqual({ key: "key", map_id: "map" });
    expect(google_maps({ GOOGLE_MAPS_API_KEY: "key", GOOGLE_MAPS_MAP_ID: "" })).toBeNull();
    expect(google_maps({ GOOGLE_MAPS_API_KEY: " ", GOOGLE_MAPS_MAP_ID: "map" })).toBeNull();
    expect(google_maps({})).toBeNull();
    expect(google_maps(undefined)).toBeNull();
  });
});
