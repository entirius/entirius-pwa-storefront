// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { resolve_media_url } from "@/utils/media-url";
import {
  build_catalog_jsonld,
  build_catalog_metadata,
  build_product_jsonld,
  build_product_metadata,
} from "./build";

// Shapes of products/?include=full and categories/?url_key=; the mapping is the SEO block of _CONFIG/app.config.json.
const PRODUCT = {
  name: "Office Chair",
  sku: "CH-1",
  url_key: "office-chair",
  meta_title: "",
  meta_description: "",
  short_description: "",
  description: `<p>An executive office chair ${"with ergonomic support ".repeat(10)}</p>`,
  media: [],
  main_image: { type: "picture", position: 1, source_set: [{ width: 512, source: "/media/chair.png" }] },
  price: { currency: "eur", gross: "619.13", final_gross: "619.13" },
  on_stock: false,
  brands: [{ name: "Quasar" }],
};

const CATEGORY = {
  name: "Office Chairs",
  url_key: "office-chairs",
  meta_title: "",
  meta_description: "",
  description: "<p>Office seating</p>",
  image_url: "/media/category/chairs.jpg",
  og_image_url: null,
  noindex: true,
  nofollow: false,
  breadcrumbs: [{ name: "Chairs", url_key: "chairs" }],
};

const CTX = { country: "default" };

describe("product SEO", () => {
  it("metadata: plain-text description of at most 160 characters, picture from main_image when media is empty", () => {
    const meta = build_product_metadata(PRODUCT, CTX);
    expect(meta.description).toMatch(/^An executive office chair with ergonomic support .*…$/);
    expect((meta.description as string).length).toBeLessThanOrEqual(160);
    expect(meta.openGraph?.images).toEqual([resolve_media_url("/media/chair.png")]);
  });

  it("JSON-LD: full description, image, availability and upper-case currency", () => {
    const ld = build_product_jsonld(PRODUCT, CTX);
    expect(ld.description).not.toMatch(/[<…]/);
    expect(ld.image).toEqual([resolve_media_url("/media/chair.png")]);
    expect(ld.offers).toMatchObject({
      price: "619.13",
      priceCurrency: "EUR",
      availability: "https://schema.org/OutOfStock",
    });
  });
});

describe("catalog SEO", () => {
  it("metadata: description, absolute image, robots from noindex/nofollow", () => {
    const meta = build_catalog_metadata(CATEGORY, CTX);
    expect(meta.description).toBe("Office seating");
    expect(meta.openGraph?.images).toEqual([resolve_media_url("/media/category/chairs.jpg")]);
    expect(meta.robots).toEqual({ index: false, follow: true });
  });

  it("metadata: no robots for an indexable category", () => {
    expect(build_catalog_metadata({ ...CATEGORY, noindex: false }, CTX).robots).toBeUndefined();
  });

  it("JSON-LD: CollectionPage with description and image, then the breadcrumbs", () => {
    const [page, trail] = build_catalog_jsonld(CATEGORY, CTX);
    expect(page).toMatchObject({
      "@type": "CollectionPage",
      description: "Office seating",
      image: resolve_media_url("/media/category/chairs.jpg"),
    });
    expect(trail).toMatchObject({ "@type": "BreadcrumbList" });
  });
});
