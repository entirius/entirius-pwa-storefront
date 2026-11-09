// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { build_csp, make_nonce, merge_sources } from "./csp";

const base = { nonce: "abc", dev: false, api_base_url: "https://api.shop.test/", site_url: "https://shop.test" };

const directive = (policy: string, name: string) =>
  policy.split("; ").find((d) => d.split(" ")[0] === name);

describe("build_csp", () => {
  it("runs scripts with the nonce only, no eval in production", () => {
    const policy = build_csp(base);
    expect(directive(policy, "script-src")).toBe("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(policy).not.toContain("unsafe-eval");
  });

  it("allows eval in development, which React's dev build needs", () => {
    expect(directive(build_csp({ ...base, dev: true }), "script-src")).toContain("'unsafe-eval'");
  });

  it("keeps inline styles without a nonce, which would switch them off", () => {
    expect(directive(build_csp(base), "style-src")).toBe("style-src 'self' 'unsafe-inline'");
  });

  it("lets the browser call the API and show its media", () => {
    const policy = build_csp(base);
    expect(directive(policy, "connect-src")).toBe("connect-src 'self' https://api.shop.test");
    expect(directive(policy, "img-src")).toContain("https://api.shop.test");
  });

  it("forbids plugins, framing and foreign form targets", () => {
    const policy = build_csp(base);
    expect(directive(policy, "object-src")).toBe("object-src 'none'");
    expect(directive(policy, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(policy, "form-action")).toBe("form-action 'self'");
  });

  it("upgrades insecure requests only for a shop on https in production", () => {
    expect(build_csp(base)).toContain("upgrade-insecure-requests");
    expect(build_csp({ ...base, site_url: "http://localhost:3100" })).not.toContain("upgrade-insecure-requests");
    expect(build_csp({ ...base, dev: true })).not.toContain("upgrade-insecure-requests");
  });

  it("adds a deployment's own sources per directive, a new directive included", () => {
    const policy = build_csp({
      ...base,
      extra: { "script-src": ["https://www.googletagmanager.com"], "frame-src": ["https://secure.payu.com"], "img-src": [] },
    });
    expect(directive(policy, "script-src")).toContain("https://www.googletagmanager.com");
    expect(directive(policy, "frame-src")).toBe("frame-src 'self' https://secure.payu.com");
    expect(directive(policy, "img-src")).toBe("img-src 'self' data: blob: https://api.shop.test");
  });

  it("leaves out an API base that is not a URL", () => {
    expect(directive(build_csp({ ...base, api_base_url: "" }), "connect-src")).toBe("connect-src 'self'");
  });
});

describe("make_nonce", () => {
  it("is new for every request", () => {
    expect(make_nonce()).not.toBe(make_nonce());
  });
});

describe("merge_sources", () => {
  it("joins the sets per directive, each source once", () => {
    expect(
      merge_sources({ "img-src": ["https://a.test"], "frame-src": [] }, undefined, { "img-src": ["https://a.test", "https://b.test"] }),
    ).toEqual({ "img-src": ["https://a.test", "https://b.test"] });
  });
});

