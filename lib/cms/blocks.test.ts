// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { cms_picture, cms_pictures, cms_width, option, spaced, text } from "./blocks";

const upload = (image: string, alt: string | null = null) => ({
  image,
  width: 1200,
  height: 800,
  meta: { alt, fileName: `${image.split("/").pop()}` },
});

describe("CMS block values", () => {
  it("reads the section width: full width only for `full_width`", () => {
    expect(cms_width("full_width")).toBe("full_width");
    expect(cms_width("container")).toBe("container");
    expect(cms_width(undefined)).toBe("container");
    expect(cms_width("something-else")).toBe("container");
  });

  it("keeps the spacing unless the editor switched it off", () => {
    expect(spaced(undefined)).toBe(true);
    expect(spaced(false)).toBe(false);
    expect(spaced("false")).toBe(false);
  });

  it("takes text and number options only when they are there", () => {
    expect(text("  ")).toBeUndefined();
    expect(text(3)).toBeUndefined();
    expect(text("Title")).toBe("Title");
    expect(option(2, 1)).toBe(2);
    expect(option("2", 1)).toBe(1);
  });

  it("reads both versions of a picture, its alt text or else its file name", () => {
    expect(cms_pictures({ desktop: upload("/media/cms/wide.jpg", "A sofa"), mobile: upload("/media/cms/tall.jpg") })).toEqual({
      desktop: { src: "/media/cms/wide.jpg", width: 1200, height: 800, alt: "A sofa" },
      mobile: { src: "/media/cms/tall.jpg", width: 1200, height: 800, alt: "tall.jpg" },
    });
    expect(cms_pictures({ desktop: { image: "" } })).toBeNull();
    expect(cms_pictures(undefined)).toBeNull();
  });

  it("takes the desktop picture for a single one, else the mobile", () => {
    expect(cms_picture({ mobile: upload("/media/cms/tall.jpg") })?.src).toBe("/media/cms/tall.jpg");
    expect(cms_picture({ desktop: upload("/media/cms/wide.jpg"), mobile: upload("/media/cms/tall.jpg") })?.src).toBe(
      "/media/cms/wide.jpg",
    );
  });
});
