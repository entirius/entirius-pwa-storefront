// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { API_BASE_URL } from "@/_CONFIG/app.config.json";
import { image_placeholder, resolve_media_uri } from "./media.normalizer";

describe("resolve_media_uri", () => {
  it("resolves backend-relative media against the API host", () => {
    expect(resolve_media_uri("/media/image/a.png")).toBe(new URL("/media/image/a.png", API_BASE_URL).toString());
  });

  it("passes absolute URLs through", () => {
    expect(resolve_media_uri("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
  });

  it("falls back to the placeholder for anything else", () => {
    expect(resolve_media_uri("")).toBe(image_placeholder);
    expect(resolve_media_uri(null)).toBe(image_placeholder);
    expect(resolve_media_uri(42)).toBe(image_placeholder);
  });
});
