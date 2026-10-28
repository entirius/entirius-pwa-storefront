// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// A published `blog-post` → the post page's view: title, cover, authors in the page language, dates, neighbours, and
// the builder content with ids on its H2 headings, listed as the table of contents. An article written in AI Studio
// is `section-text` sections (HTML with H2 headings) and a closing `section-faq`; older posts keep their text in tiles.

import type { CmsImagesSet } from "@/app/[customer_country]/(builder)/[[...slug]]/_components/cms-image";
import type { BlogAuthorBrief, BlogAuthorRaw, BlogPostRaw, BlogPostSibling } from "@/types/blog.types";
import type { CmsDocumentContent, CmsSectionData } from "@/types/cms.types";
import { plain_text } from "@/lib/seo/transforms";

export type BlogAuthor = { name: string; slug: string; role: string; bio: string; photo: string | null };
export type BlogPostLink = { title: string; slug: string };
export type TocEntry = { id: string; text: string };
export type FaqEntry = { question: string; answer: string };

export type BlogPost = {
  slug: string;
  // Lowercase ISO code of the language the post is written in.
  language: string;
  // The heading (the post's tile title).
  title: string;
  cover: CmsImagesSet | null;
  // What the CMS sets for search and sharing, each falling back to the next: descriptions are plain text, `image` is
  // a backend path (`meta.og_image`, else the cover).
  seo: { title: string; description: string; og_title: string; og_description: string; image: string | null };
  category: { name: string; url_key: string } | null;
  authors: BlogAuthor[];
  published_at: string | null;
  updated_at: string | null;
  prev: BlogPostLink | null;
  next: BlogPostLink | null;
  content: CmsDocumentContent;
  toc: TocEntry[];
  faq: { title: string; items: FaqEntry[] } | null;
};

// The anchor of the `section-faq` block, the table of contents' last entry.
export const FAQ_ANCHOR = "faq";

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// Heading text → anchor id, a plain slug ("Which system is it?" → "which-system-is-it"). DOMPurify drops
// an id that names a `document` property (`links`, `title`, `images`), and such a name is always one word: a
// one-word id gets `-section`, an id with a hyphen never collides.
export function heading_id(heading: string, taken: Set<string>): string {
  const slug =
    heading
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      // `ł` has no decomposition to strip.
      .replace(/ł/g, "l")
      .replace(/Ł/g, "L")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
  const base = slug.includes("-") ? slug : `${slug}-section`;
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  taken.add(id);
  return id;
}

const H2 = /<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi;

// Every H2 of a rich-text field gets an id (its own `id` attribute is replaced) and a table of contents entry.
function anchor_headings(html: string, taken: Set<string>, toc: TocEntry[]): string {
  return html.replace(H2, (heading, attributes: string | undefined, inner: string) => {
    const label = plain_text(inner);
    if (!label) return heading;
    const id = heading_id(label, taken);
    toc.push({ id, text: label });
    const kept = (attributes ?? "").replace(/\s+id\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    return `<h2 id="${id}"${kept}>${inner}</h2>`;
  });
}

type RawFaqItem = { question?: unknown; answer?: unknown };

function faq_of(section: CmsSectionData): { title: string; items: FaqEntry[] } | null {
  const items = (Array.isArray(section.faq_items) ? (section.faq_items as RawFaqItem[]) : [])
    .map((item) => ({ question: text(item?.question), answer: text(item?.answer) }))
    .filter((item) => item.question);
  return items.length ? { title: text(section.title), items } : null;
}

// The content with heading ids, its table of contents in reading order, and its FAQ.
export function with_anchors(content: CmsDocumentContent): Pick<BlogPost, "content" | "toc" | "faq"> {
  const taken = new Set<string>([FAQ_ANCHOR]);
  const toc: TocEntry[] = [];
  let faq: BlogPost["faq"] = null;
  const sections = { ...content.sections };
  const tiles = { ...content.tiles };
  const anchored = (block: CmsSectionData): CmsSectionData =>
    typeof block.description === "string"
      ? { ...block, description: anchor_headings(block.description, taken, toc) }
      : block;

  for (const uid of content.sections_order ?? []) {
    const section = sections[uid];
    if (!section) continue;
    if (section.core_type === "section-faq") {
      // The first FAQ only: it owns the anchor.
      const found: BlogPost["faq"] = faq ? null : faq_of(section);
      if (found) {
        faq = found;
        if (found.title) toc.push({ id: FAQ_ANCHOR, text: found.title });
      }
      continue;
    }
    sections[uid] = anchored(section);
    for (const tile_uid of content.tiles_order?.[uid] ?? []) {
      if (tiles[tile_uid]) tiles[tile_uid] = anchored(tiles[tile_uid]);
    }
  }
  return { content: { ...content, sections, tiles }, toc, faq };
}

// `*_t9n` text in the first of the languages that has it.
const in_language = (t9n: Record<string, string> | undefined, languages: string[]) =>
  languages.map((language) => text(t9n?.[language])).find(Boolean) ?? "";

function norm_author(raw: BlogAuthorBrief, languages: string[]): BlogAuthor {
  return {
    name: text(raw.name),
    slug: text(raw.slug),
    role: in_language(raw.role_t9n, languages),
    bio: in_language(raw.description_t9n, languages),
    photo: text(raw.photo_url) || null,
  };
}

const link_of = (sibling: BlogPostSibling | null | undefined): BlogPostLink | null => {
  const slug = text(sibling?.routes?.[0]);
  return slug ? { slug, title: text(sibling?.title) || text(sibling?.name) || slug } : null;
};

const EMPTY_CONTENT: CmsDocumentContent = { sections: {}, tiles: {}, sections_order: [], tiles_order: {} };

// Authors and co-authors (an author listed as both is shown once); the free-text `extension.author` of older posts
// when the post lists none.
function authors_of(raw: BlogPostRaw, languages: string[]): BlogAuthor[] {
  const listed = [...(raw.authors ?? []), ...(raw.co_authors ?? [])]
    .map((author) => norm_author(author, languages))
    .filter((author, i, all) => author.name && all.findIndex((other) => other.slug === author.slug) === i);
  const free_text = text(raw.extension?.author);
  return listed.length || !free_text ? listed : [{ name: free_text, slug: "", role: "", bio: "", photo: null }];
}

const cover_of = (raw: BlogPostRaw): CmsImagesSet | null => {
  const images = raw.extension?.images_set;
  return images?.desktop || images?.mobile ? images : null;
};

// The post's heading: its tile title, else the CMS title or the document name.
const title_of = (raw: BlogPostRaw, slug: string) =>
  text(raw.extension?.title) || text(raw.meta?.title) || text(raw.name) || slug;

// `language`: the page's language; author roles and bios fall back to the post's own.
export function NORM_BLOG_POST(raw: BlogPostRaw, language: string): BlogPost {
  const own_language = text(raw.language).toLowerCase();
  const slug = text(raw.routes?.[0]);
  const authors = authors_of(raw, [language.toLowerCase(), own_language]);
  const cover = cover_of(raw);

  const meta = raw.meta ?? {};
  const title = title_of(raw, slug);
  const seo_title = text(meta.title) || title;
  const description = text(meta.description) || plain_text(text(raw.extension?.description));

  return {
    slug,
    language: own_language,
    title,
    cover,
    seo: {
      title: seo_title,
      description,
      og_title: text(meta.og_title) || seo_title,
      og_description: text(meta.og_description) || description,
      image: text(meta.og_image) || cover?.desktop?.image || cover?.mobile?.image || null,
    },
    category: raw.category?.url_key ? { name: text(raw.category.name), url_key: raw.category.url_key } : null,
    authors,
    published_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
    prev: link_of(raw.prev),
    next: link_of(raw.next),
    ...with_anchors(raw.content ?? EMPTY_CONTENT),
  };
}

// A post on a listing (its tile): heading, summary in plain text, cover, author names and the publication date.
export type BlogPostCard = {
  slug: string;
  language: string;
  title: string;
  excerpt: string;
  cover: CmsImagesSet | null;
  authors: string[];
  published_at: string | null;
};

export function NORM_BLOG_POST_CARD(raw: BlogPostRaw): BlogPostCard {
  const slug = text(raw.routes?.[0]);
  return {
    slug,
    language: text(raw.language).toLowerCase(),
    title: title_of(raw, slug),
    excerpt: plain_text(text(raw.extension?.description)) || text(raw.meta?.description),
    cover: cover_of(raw),
    authors: authors_of(raw, []).map((author) => author.name),
    published_at: raw.created_at ?? null,
  };
}

// The cards of a list answer, those with a route only (a post without one has no page).
export const NORM_BLOG_POST_CARDS = (rows: BlogPostRaw[] | undefined): BlogPostCard[] =>
  (rows ?? []).map(NORM_BLOG_POST_CARD).filter((card) => card.slug);

export type BlogLink = { url: string; label: string };

// An author's page: the post card's author with the links of their profile.
export type BlogAuthorProfile = BlogAuthor & { links: BlogLink[] };

const web_link = (value: unknown): BlogLink | null => {
  try {
    const url = new URL(text(value));
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    // The address names the link: a brand name would be interface text, the host is data.
    return { url: url.href, label: url.hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
};

// Website first, then the social profiles (`other` holds named extra ones); non-web values are left out.
export function NORM_BLOG_AUTHOR(raw: BlogAuthorRaw, language: string): BlogAuthorProfile {
  const profiles = Object.values(raw.social_profiles ?? {}).flatMap((value) =>
    value && typeof value === "object" ? Object.values(value) : [value],
  );
  const links = [raw.contact_url, ...profiles]
    .map(web_link)
    .filter((link, i, all): link is BlogLink => !!link && all.findIndex((other) => other?.url === link.url) === i);
  return { ...norm_author(raw, [language.toLowerCase(), "en"]), links };
}

// A post date in the page's language; English keeps the en-GB order, like order dates. In UTC: a client tile formats
// it again on hydration, in the browser's zone.
export function format_blog_date(iso: string, language: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(language === "en" ? "en-GB" : language, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Whether the post was published again on a later day than it was written.
export const updated_later = (post: Pick<BlogPost, "published_at" | "updated_at">) =>
  !!post.published_at && !!post.updated_at && post.updated_at.slice(0, 10) > post.published_at.slice(0, 10);
