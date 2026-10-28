// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import { resolve_media_url } from "@/utils/media-url";
import type { BlogPost } from "@/utils/NORMALIZERS/blog-post.normalizer";
import { SITE_URL } from "./config";
import {
  build_blog_author_jsonld,
  build_blog_author_metadata,
  build_blog_list_jsonld,
  build_blog_post_jsonld,
  build_blog_post_metadata,
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

// A normalized post (NORM_BLOG_POST) with a FAQ.
const POST: BlogPost = {
  slug: "erp-integration",
  language: "en",
  title: "ERP integration",
  cover: null,
  seo: {
    title: "ERP integration | Shop",
    description: "How to connect a shop to an ERP.",
    og_title: "Connect your shop to an ERP",
    og_description: "Data in sync",
    image: "/media/cover.png",
  },
  category: { name: "E-commerce", url_key: "e-commerce" },
  authors: [{ name: "Anna Kowalska", slug: "anna-kowalska", role: "Editor in Chief", bio: "", photo: null }],
  published_at: "2026-10-20T10:00:00Z",
  updated_at: "2026-10-26T08:00:00Z",
  prev: null,
  next: null,
  content: { sections: {}, tiles: {}, sections_order: [], tiles_order: {} },
  toc: [],
  faq: { title: "FAQ", items: [{ question: "How long?", answer: "<p>A <strong>week</strong>.</p>" }] },
};

describe("blog post SEO", () => {
  it("metadata: an article with its dates, authors, section and absolute image", () => {
    const meta = build_blog_post_metadata(POST, { country: "pl" });
    expect(meta.title).toBe("ERP integration | Shop");
    expect(meta.alternates?.canonical).toBe("/pl/blog/erp-integration");
    expect(meta.openGraph).toMatchObject({
      type: "article",
      title: "Connect your shop to an ERP",
      description: "Data in sync",
      images: [resolve_media_url("/media/cover.png")],
      publishedTime: "2026-10-20T10:00:00Z",
      modifiedTime: "2026-10-26T08:00:00Z",
      authors: ["Anna Kowalska"],
      section: "E-commerce",
    });
  });

  it("JSON-LD: BlogPosting, FAQPage with plain-text answers, then the breadcrumbs", () => {
    const [posting, faq, trail] = build_blog_post_jsonld(POST, CTX, [{ name: "Blog", path: "/blog" }]);
    expect(posting).toMatchObject({
      "@type": "BlogPosting",
      headline: "ERP integration",
      datePublished: "2026-10-20T10:00:00Z",
      dateModified: "2026-10-26T08:00:00Z",
      inLanguage: "en",
      articleSection: "E-commerce",
      author: [{ "@type": "Person", name: "Anna Kowalska", jobTitle: "Editor in Chief" }],
      url: `${SITE_URL}/blog/erp-integration`,
    });
    expect(faq).toMatchObject({
      "@type": "FAQPage",
      mainEntity: [{ name: "How long?", acceptedAnswer: { "@type": "Answer", text: "A week." } }],
    });
    expect(trail).toMatchObject({
      "@type": "BreadcrumbList",
      itemListElement: [
        { position: 1, name: "Blog", item: `${SITE_URL}/blog` },
        { position: 2, name: "ERP integration", item: `${SITE_URL}/blog/erp-integration` },
      ],
    });
  });

  it("JSON-LD: an author links their page", () => {
    const [posting] = build_blog_post_jsonld(POST, CTX, []);
    expect(posting.author).toEqual([
      { "@type": "Person", name: "Anna Kowalska", jobTitle: "Editor in Chief", url: `${SITE_URL}/blog/authors/anna-kowalska` },
    ]);
  });

  it("JSON-LD: no FAQPage without a FAQ", () => {
    const graph = build_blog_post_jsonld({ ...POST, faq: null }, CTX, []);
    expect(graph.map((node) => node["@type"])).toEqual(["BlogPosting", "BreadcrumbList"]);
  });
});

describe("blog list and author SEO", () => {
  const AUTHOR = {
    name: "Anna Kowalska",
    slug: "anna-kowalska",
    role: "Editor in Chief",
    bio: "Senior editor",
    photo: null,
    links: [{ url: "https://linkedin.com/in/anna", label: "linkedin.com" }],
  };

  it("list JSON-LD: the Blog of the page's posts at the list's own address", () => {
    const card = { slug: "erp", language: "en", title: "ERP", excerpt: "", cover: null, authors: [], published_at: null };
    expect(build_blog_list_jsonld([card], CTX, { name: "Blog", category: "news", page: 2 })).toEqual({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Blog",
      url: `${SITE_URL}/blog?category_url_key=news&page=2`,
      blogPost: [{ "@type": "BlogPosting", headline: "ERP", url: `${SITE_URL}/blog/erp` }],
    });
  });

  it("author metadata: a profile with the bio as description", () => {
    const meta = build_blog_author_metadata(AUTHOR, { country: "pl" });
    expect(meta.alternates?.canonical).toBe("/pl/blog/authors/anna-kowalska");
    expect(meta.description).toBe("Senior editor");
    expect(meta.openGraph).toMatchObject({ type: "profile", title: "Anna Kowalska" });
  });

  it("author JSON-LD: ProfilePage of the Person with their links, then the breadcrumbs", () => {
    const [profile, trail] = build_blog_author_jsonld(AUTHOR, CTX, [{ name: "Blog", path: "/blog" }]);
    expect(profile).toMatchObject({
      "@type": "ProfilePage",
      mainEntity: { "@type": "Person", name: "Anna Kowalska", sameAs: ["https://linkedin.com/in/anna"] },
    });
    expect(trail).toMatchObject({ "@type": "BreadcrumbList" });
  });
});
