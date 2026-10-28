// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, expect, it } from "vitest";
import DOMPurify from "isomorphic-dompurify";
import type { BlogPostRaw } from "@/types/blog.types";
import {
  FAQ_ANCHOR,
  NORM_BLOG_AUTHOR,
  NORM_BLOG_POST,
  NORM_BLOG_POST_CARDS,
  format_blog_date,
  heading_id,
  updated_later,
  with_anchors,
} from "./blog-post.normalizer";

// An article as AI Studio writes it: text sections without tiles, then the FAQ. In Polish on purpose (quoted test
// data): the converter titles a `pl` FAQ in Polish, and the anchor ids must fold Polish letters.
const ai_article: BlogPostRaw = {
  uid: "c1",
  name: "Erp",
  language: "PL",
  routes: ["integracja-erp"],
  meta: { title: "Integracja z ERP | Sklep", description: "Jak połączyć sklep z ERP.", og_image: "/media/cover.png" },
  extension: { title: "Integracja sklepu z ERP", description: "<p>Zajawka</p>" },
  category: { uid: "k1", name: "E-commerce", url_key: "e-commerce" },
  authors: [
    {
      uid: "a1",
      name: "Anna Kowalska",
      slug: "anna-kowalska",
      role_t9n: { en: "Editor in Chief", pl: "Redaktor naczelny" },
      description_t9n: { en: "Senior editor" },
      photo_url: null,
    },
  ],
  co_authors: [{ uid: "a1", name: "Anna Kowalska", slug: "anna-kowalska" }],
  created_at: "2026-10-20T10:00:00Z",
  updated_at: "2026-10-26T08:00:00Z",
  prev: { uid: "c0", title: "Starszy wpis", routes: ["starszy"] },
  next: null,
  content: {
    sections: {
      s1: { core_type: "section-text", title: undefined, description: "<p>Wstęp</p><h2>Czym jest integracja?</h2><p>…</p>" },
      s2: { core_type: "section-text", description: '<h2 id="old" class="x">Źródło prawdy &amp; dane</h2><h2>Podsumowanie</h2>' },
      s3: {
        core_type: "section-faq",
        title: "Na jakie pytania znajdziesz odpowiedź w tym artykule?",
        faq_items: [
          { question: "Ile to kosztuje?", answer: "<p>To zależy.</p>" },
          { question: "", answer: "<p>Bez pytania</p>" },
        ],
      },
    },
    tiles: {},
    sections_order: ["s1", "s2", "s3"],
    tiles_order: {},
  },
};

describe("NORM_BLOG_POST", () => {
  const post = NORM_BLOG_POST(ai_article, "en");

  it("takes the tile title for the heading and the CMS meta for search and sharing", () => {
    expect(post.slug).toBe("integracja-erp");
    expect(post.language).toBe("pl");
    expect(post.title).toBe("Integracja sklepu z ERP");
    expect(post.seo).toEqual({
      title: "Integracja z ERP | Sklep",
      description: "Jak połączyć sklep z ERP.",
      og_title: "Integracja z ERP | Sklep",
      og_description: "Jak połączyć sklep z ERP.",
      image: "/media/cover.png",
    });
    expect(post.category).toEqual({ name: "E-commerce", url_key: "e-commerce" });
  });

  it("lists an author once, in the page language, else the post's", () => {
    expect(post.authors).toEqual([
      { name: "Anna Kowalska", slug: "anna-kowalska", role: "Editor in Chief", bio: "Senior editor", photo: null },
    ]);
    expect(NORM_BLOG_POST(ai_article, "pl").authors[0].role).toBe("Redaktor naczelny");
  });

  it("falls back to the free-text author of older posts", () => {
    const older = NORM_BLOG_POST(
      { ...ai_article, authors: [], co_authors: [], meta: { title: "Integracja z ERP | Sklep" }, extension: { author: "Jan Nowak" } },
      "en",
    );
    expect(older.authors.map((a) => a.name)).toEqual(["Jan Nowak"]);
    expect(older.title).toBe("Integracja z ERP | Sklep");
    expect(older.seo.image).toBeNull();
  });

  it("links the neighbours by their route", () => {
    expect(post.prev).toEqual({ slug: "starszy", title: "Starszy wpis" });
    expect(post.next).toBeNull();
  });

  it("anchors every H2 and lists them with the FAQ last", () => {
    expect(post.toc).toEqual([
      { id: "czym-jest-integracja", text: "Czym jest integracja?" },
      { id: "zrodlo-prawdy-dane", text: "Źródło prawdy & dane" },
      { id: "podsumowanie-section", text: "Podsumowanie" },
      { id: FAQ_ANCHOR, text: "Na jakie pytania znajdziesz odpowiedź w tym artykule?" },
    ]);
    expect(post.content.sections.s2.description).toBe(
      '<h2 id="zrodlo-prawdy-dane" class="x">Źródło prawdy &amp; dane</h2><h2 id="podsumowanie-section">Podsumowanie</h2>',
    );
    // the raw content stays as it was
    expect(ai_article.content.sections.s1.description).not.toContain("id=");
  });

  it("keeps FAQ items that have a question", () => {
    expect(post.faq).toEqual({
      title: "Na jakie pytania znajdziesz odpowiedź w tym artykule?",
      items: [{ question: "Ile to kosztuje?", answer: "<p>To zależy.</p>" }],
    });
  });
});

describe("NORM_BLOG_POST_CARDS", () => {
  it("gives a tile the summary in plain text and the author names, and drops a post without a route", () => {
    expect(NORM_BLOG_POST_CARDS([ai_article, { ...ai_article, routes: [] }])).toEqual([
      {
        slug: "integracja-erp",
        language: "pl",
        title: "Integracja sklepu z ERP",
        excerpt: "Zajawka",
        cover: null,
        authors: ["Anna Kowalska"],
        published_at: "2026-10-20T10:00:00Z",
      },
    ]);
  });
});

describe("NORM_BLOG_AUTHOR", () => {
  it("lists the website and the social profiles as web links named by their host", () => {
    const author = NORM_BLOG_AUTHOR(
      {
        uid: "a1",
        name: "Anna Kowalska",
        slug: "anna-kowalska",
        role_t9n: { en: "Editor in Chief", pl: "Redaktor naczelny" },
        contact_url: "https://www.anna.example/",
        social_profiles: { linkedin: "https://linkedin.com/in/anna", other: { blog: "https://anna.example/", bad: "javascript:alert(1)" } },
      },
      "pl",
    );
    expect(author.role).toBe("Redaktor naczelny");
    expect(author.links).toEqual([
      { url: "https://www.anna.example/", label: "anna.example" },
      { url: "https://linkedin.com/in/anna", label: "linkedin.com" },
      { url: "https://anna.example/", label: "anna.example" },
    ]);
  });
});

describe("with_anchors", () => {
  it("reads headings in tiles too, in section order", () => {
    const { toc } = with_anchors({
      sections: { a: { core_type: "section-text" }, b: { core_type: "section-text", description: "<h2>First</h2>" } },
      tiles: { t: { core_type: "tile-txt-btn", description: "<h2>Second heading</h2>" } },
      sections_order: ["b", "a"],
      tiles_order: { a: ["t"] },
    });
    expect(toc.map((entry) => entry.id)).toEqual(["first-section", "second-heading"]);
  });
});

describe("heading_id", () => {
  it("never repeats an id", () => {
    const taken = new Set<string>();
    expect([heading_id("Data flow", taken), heading_id("Data flow", taken), heading_id("!!!", taken)]).toEqual([
      "data-flow",
      "data-flow-2",
      "section-section",
    ]);
  });

  it("gives ids that survive the sanitizer", () => {
    for (const word of ["Links", "Title", "Images", "Forms", "Cookie"]) {
      const id = heading_id(word, new Set());
      expect(DOMPurify.sanitize(`<h2 id="${id}">x</h2>`)).toContain(`id="${id}"`);
    }
  });
});

describe("helpers", () => {
  it("format_blog_date follows the page language", () => {
    expect(format_blog_date("2026-10-26T08:00:00Z", "en")).toBe("26 October 2026");
    expect(format_blog_date("2026-10-26T08:00:00Z", "pl")).toBe("26 października 2026");
    expect(format_blog_date("not a date", "en")).toBe("");
  });

  it("updated_later compares days", () => {
    expect(updated_later({ published_at: "2026-10-20T10:00:00Z", updated_at: "2026-10-26T08:00:00Z" })).toBe(true);
    expect(updated_later({ published_at: "2026-10-20T10:00:00Z", updated_at: "2026-10-20T18:00:00Z" })).toBe(false);
  });
});
