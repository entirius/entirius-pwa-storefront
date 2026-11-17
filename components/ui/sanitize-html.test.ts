// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ push: vi.fn(), navigate: null as ((href: string) => void) | null }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/sanitize-html", () => ({ sanitize_html: (html: string) => html }));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useContext: () => mocks.navigate,
  useMemo: (factory: () => unknown) => factory(),
}));

import { ClientNavigation, SanitizeHTML } from "./sanitize-html";

type ClickOptions = { button?: number; defaultPrevented?: boolean; modifier?: string };
type LinkAttrs = { href?: string; target?: string; download?: boolean };

function click(attrs: LinkAttrs, options: ClickOptions = {}) {
  const link = {
    href: attrs.href,
    target: attrs.target ?? "",
    hasAttribute: (name: string) => (name === "href" ? attrs.href !== undefined : name === "download" && !!attrs.download),
  };
  const event = {
    button: options.button ?? 0,
    defaultPrevented: options.defaultPrevented ?? false,
    metaKey: options.modifier === "meta",
    ctrlKey: options.modifier === "ctrl",
    shiftKey: options.modifier === "shift",
    altKey: options.modifier === "alt",
    target: { closest: () => link },
    currentTarget: { contains: () => true },
    preventDefault: vi.fn(),
  };
  const element = SanitizeHTML({ html: "<a>x</a>" }) as { props: { onClick?: (e: unknown) => void } };
  element.props.onClick?.(event);
  return event;
}

beforeEach(() => {
  mocks.push.mockReset();
  mocks.navigate = mocks.push;
  vi.stubGlobal("window", { location: { href: "https://shop.test/page?a=1", origin: "https://shop.test", pathname: "/page", search: "?a=1" } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ClientNavigation", () => {
  it("provides router.push to the rich text below it", () => {
    const element = ClientNavigation({ children: null }) as { props: { value: unknown } };
    expect(element.props.value).toBe(mocks.push);
  });
});

describe("SanitizeHTML link clicks with ClientNavigation", () => {
  it("pushes pathname, search and hash of a plain internal link and prevents default", () => {
    const event = click({ href: "https://shop.test/about?x=1#team" });
    expect(mocks.push).toHaveBeenCalledWith("/about?x=1#team");
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it.each(["meta", "ctrl", "shift", "alt"])("ignores a click with the %s key", (modifier) => {
    const event = click({ href: "https://shop.test/about" }, { modifier });
    expect(mocks.push).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("ignores a non-zero mouse button", () => {
    click({ href: "https://shop.test/about" }, { button: 1 });
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("ignores an already prevented click", () => {
    click({ href: "https://shop.test/about" }, { defaultPrevented: true });
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("ignores an external origin", () => {
    const event = click({ href: "https://other.test/about" });
    expect(mocks.push).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('ignores target="_blank"', () => {
    click({ href: "https://shop.test/about", target: "_blank" });
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("follows target=_self", () => {
    click({ href: "https://shop.test/about", target: "_self" });
    expect(mocks.push).toHaveBeenCalledWith("/about");
  });

  it("ignores a download link", () => {
    click({ href: "https://shop.test/file.pdf", download: true });
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("ignores a hash-only link to the current page", () => {
    const event = click({ href: "https://shop.test/page?a=1#section" });
    expect(mocks.push).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("pushes the same path with a different search", () => {
    click({ href: "https://shop.test/page?a=2#section" });
    expect(mocks.push).toHaveBeenCalledWith("/page?a=2#section");
  });
});

describe("SanitizeHTML without ClientNavigation", () => {
  it("renders no click handler, so nothing is pushed or prevented", () => {
    mocks.navigate = null;
    const event = click({ href: "https://shop.test/about" });
    expect(mocks.push).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
