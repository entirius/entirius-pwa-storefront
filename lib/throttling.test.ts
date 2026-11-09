// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { create_i18n } from "./i18n/translate";
import { en } from "./i18n/messages/en";
import { pl } from "./i18n/messages/pl";
import { retry_after_seconds, throttled_message } from "./throttling";

describe("retry_after_seconds", () => {
  it("reads whole and fractional seconds", () => {
    expect(retry_after_seconds("57")).toBe(57);
    expect(retry_after_seconds("0.4")).toBe(1);
  });

  it("is null for a missing, zero or non-numeric value (an HTTP date included)", () => {
    expect(retry_after_seconds(null)).toBeNull();
    expect(retry_after_seconds(undefined)).toBeNull();
    expect(retry_after_seconds("0")).toBeNull();
    expect(retry_after_seconds("Wed, 21 Oct 2026 07:28:00 GMT")).toBeNull();
  });
});

describe("throttled_message", () => {
  const { t } = create_i18n("en", en);

  it("names no time without Retry-After", () => {
    expect(throttled_message(t, null)).toBe("Too many attempts. Please wait a few minutes and try again.");
  });

  it("rounds the wait up to whole minutes, at least one", () => {
    expect(throttled_message(t, 57)).toBe("Too many attempts. Please try again in 1 minute.");
    expect(throttled_message(t, 900)).toBe("Too many attempts. Please try again in 15 minutes.");
    expect(throttled_message(t, 61)).toBe("Too many attempts. Please try again in 2 minutes.");
  });

  it("uses the Polish plural forms", () => {
    const { t: t_pl } = create_i18n("pl", pl);
    expect(throttled_message(t_pl, 60)).toBe("Zbyt wiele prób. Spróbuj ponownie za 1 minutę.");
    expect(throttled_message(t_pl, 120)).toBe("Zbyt wiele prób. Spróbuj ponownie za 2 minuty.");
    expect(throttled_message(t_pl, 900)).toBe("Zbyt wiele prób. Spróbuj ponownie za 15 minut.");
  });
});
