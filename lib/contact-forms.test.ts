// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));

import { is_email, submission_json } from "./contact-forms";

describe("is_email", () => {
  it("accepts an address and rejects the rest", () => {
    expect(is_email("a@b.co")).toBe(true);
    expect(is_email("a@b")).toBe(false);
    expect(is_email("a b@c.de")).toBe(false);
    expect(is_email("")).toBe(false);
  });
});

describe("submission_json", () => {
  const base = { form_type: "product-enquiry", email: "a@b.co", slug: "product-enquiry", language: "en" };

  it("adds consent and page to the body, drops empty values, keeps the code", () => {
    const json = JSON.parse(
      submission_json({ ...base, code: "SKU-1", body: { name: "Ann", message: "Hi", note: undefined, empty: "" } }, "https://x.test/p"),
    );
    expect(json).toEqual({
      email: "a@b.co",
      slug: "product-enquiry",
      language: "en",
      code: "SKU-1",
      body: { name: "Ann", message: "Hi", consent_privacy_info: true, page_url: "https://x.test/p" },
    });
  });

  it("omits the code when there is none and does not send the form type in the payload", () => {
    const json = JSON.parse(submission_json({ ...base, body: {} }, "https://x.test/"));
    expect("code" in json).toBe(false);
    expect("form_type" in json).toBe(false);
  });
});
