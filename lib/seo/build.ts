// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Metadata } from "next";
import { DEBUG_MODE } from "@/_CONFIG/app.config.json";
import { _LOGGER } from "@/lib/logger";
import { DEFAULT_OG_IMAGES } from "@/lib/brand";
import {
  SEO_FIELDS,
  get_path,
  SITE_NAME,
  SITE_URL,
  type SeoField,
  type SEO_CONTEXT,
} from "./config";
import { apply_transform, plain_text } from "./transforms";
import { profile_path } from "@/lib/profile-path";
import { resolve_media_url } from "@/utils/media-url";
import type { BlogAuthorProfile, BlogPost, BlogPostCard } from "@/utils/NORMALIZERS/blog-post.normalizer";
import { blog_author_path, blog_list_path, blog_post_path } from "@/lib/blog-paths";

// metadataBase absolutizes Metadata fields, but raw JSON-LD is emitted as-is —
// schema.org expects absolute URLs, so build them against SITE_URL here.
const site_url = (path?: string) => (path ? `${SITE_URL}${path}` : undefined);

const is_empty = (v: unknown) =>
  v == null || v === "" || (Array.isArray(v) && v.length === 0);

// What the configured fields are expected to hold. The mapping is config-owned
// (dot-paths into the raw API object), so the bag is trusted, not checked.
type SeoBag = {
  title?: string;
  description?: string;
  url_key?: string;
  images?: string[];
  image?: string;
  noindex?: boolean;
  nofollow?: boolean;
  sku?: string;
  brand?: string;
  price?: string | number;
  currency?: string;
  availability?: string;
  rating?: string | number;
  breadcrumbs?: unknown;
};

// A schema.org node as emitted (plain JSON).
type JsonLdNode = Record<string, unknown>;

// All keys optional: callers narrow JSON-LD nodes with `d is object`, which needs that.
type ProductJsonLd = {
  "@context"?: string;
  "@type"?: "Product";
  name?: string;
  description?: string;
  image?: string[];
  sku?: string;
  brand?: { "@type": "Brand"; name: string };
  offers?: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
    availability?: string;
    url?: string;
  };
  aggregateRating?: { "@type": "AggregateRating"; ratingValue: string | number };
};

// ------------------------------------------------------------
// Config-driven core: for each [outKey, source, transform?] tuple read the raw
// object by dot-path, run the transform, and keep the first non-empty result
// of the fallback chain in a flat bag. `pick` optionally filters to a subset of outKeys.
// ------------------------------------------------------------
function resolve(
  raw: unknown,
  fields: SeoField[],
  pick?: string[],
): SeoBag {
  const bag: Record<string, unknown> = {};
  for (const [outKey, source, transform] of fields) {
    if (pick && !pick.includes(outKey)) continue;
    let value: unknown;
    for (const path of Array.isArray(source) ? source : [source]) {
      value = apply_transform(get_path(raw, path), transform);
      if (!is_empty(value)) break;
    }
    if (!is_empty(value)) {
      bag[outKey] = value;
    } else if (DEBUG_MODE) {
      _LOGGER({
        message: `SEO: field "${outKey}" resolved empty`,
        type: "warning",
        print: { source },
      });
    }
  }
  return bag as SeoBag;
}

type BuildOpts = { pick?: string[] };

// `noindex` / `nofollow` → Metadata robots; nothing when the page is indexable.
const robots = (bag: SeoBag): Metadata["robots"] =>
  bag.noindex || bag.nofollow ? { index: !bag.noindex, follow: !bag.nofollow } : undefined;

// ------------------------------------------------------------
// Product — Metadata
// ------------------------------------------------------------
export function build_product_metadata(
  raw: unknown,
  ctx: SEO_CONTEXT,
  opts: BuildOpts = {},
): Metadata {
  const bag = resolve(raw, SEO_FIELDS.PRODUCT_META, opts.pick);
  const url_key = bag.url_key ?? ctx.url_key;
  const canonical = url_key ? profile_path(ctx.country, `/product/${url_key}`) : undefined;

  return {
    title: bag.title,
    description: bag.description,
    alternates: canonical ? { canonical, languages: ctx.languages } : undefined,
    openGraph: {
      title: bag.title,
      description: bag.description,
      images: bag.images ?? DEFAULT_OG_IMAGES,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: bag.title,
      description: bag.description,
      images: bag.images ?? DEFAULT_OG_IMAGES,
    },
  };
}

// ------------------------------------------------------------
// Product — JSON-LD (schema.org/Product). Nested blocks (offers, brand,
// aggregateRating) are composed only when their fields were picked/resolved.
// ------------------------------------------------------------
export function build_product_jsonld(
  raw: unknown,
  ctx: SEO_CONTEXT,
  opts: BuildOpts = {},
): ProductJsonLd {
  const bag = resolve(raw, SEO_FIELDS.PRODUCT_JSONLD, opts.pick);
  const url_key = bag.url_key ?? ctx.url_key;
  const url = site_url(url_key ? profile_path(ctx.country, `/product/${url_key}`) : undefined);

  const jsonLd: ProductJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: bag.title,
    description: bag.description,
    image: bag.images,
    sku: bag.sku,
  };

  if (bag.brand) jsonLd.brand = { "@type": "Brand", name: bag.brand };

  if (bag.price && bag.currency) {
    jsonLd.offers = {
      "@type": "Offer",
      price: String(bag.price),
      priceCurrency: bag.currency,
      availability: bag.availability,
      url,
    };
  }

  if (bag.rating) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: bag.rating,
    };
  }

  return prune(jsonLd);
}

// ------------------------------------------------------------
// Catalog / category — Metadata
// ------------------------------------------------------------
export function build_catalog_metadata(
  raw: unknown,
  ctx: SEO_CONTEXT,
  opts: BuildOpts = {},
): Metadata {
  const bag = resolve(raw, SEO_FIELDS.CATALOG_META, opts.pick);
  const url_key = bag.url_key ?? ctx.url_key;
  const canonical = url_key ? profile_path(ctx.country, `/catalog/${url_key}`) : undefined;
  const images = bag.image ? [bag.image] : DEFAULT_OG_IMAGES;

  return {
    title: bag.title,
    description: bag.description,
    robots: robots(bag),
    alternates: canonical ? { canonical, languages: ctx.languages } : undefined,
    openGraph: {
      title: bag.title,
      description: bag.description,
      images,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

// ------------------------------------------------------------
// Catalog / category — JSON-LD: CollectionPage + BreadcrumbList (from `breadcrumbs`).
// ------------------------------------------------------------
export function build_catalog_jsonld(
  raw: unknown,
  ctx: SEO_CONTEXT,
  opts: BuildOpts = {},
): JsonLdNode[] {
  const bag = resolve(raw, SEO_FIELDS.CATALOG_JSONLD, opts.pick);
  const url_key = bag.url_key ?? ctx.url_key;

  const graph: JsonLdNode[] = [
    prune({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: bag.title,
      description: bag.description,
      image: bag.image,
      url: site_url(url_key ? profile_path(ctx.country, `/catalog/${url_key}`) : undefined),
    }),
  ];

  const trail = build_breadcrumbs_jsonld(bag.breadcrumbs, ctx);
  if (trail) graph.push(trail);

  return graph;
}

// ------------------------------------------------------------
// BreadcrumbList from an API category trail ({ name, url_key }[]): category
// `breadcrumbs`, or a product's `categories[0].path`. `current` appends the
// page itself (a product) as the last item.
// ------------------------------------------------------------
type TrailNode = { name?: string; url_key?: string };

export function build_breadcrumbs_jsonld(
  path: unknown,
  ctx: SEO_CONTEXT,
  current?: { name?: string; url?: string },
): JsonLdNode | null {
  const nodes: TrailNode[] = Array.isArray(path) ? path : [];
  const items: { name?: string; item?: string }[] = nodes.map((c) => ({
    name: c?.name,
    item: site_url(c?.url_key ? profile_path(ctx.country, `/catalog/${c.url_key}`) : undefined),
  }));
  if (current?.name) items.push({ name: current.name, item: current.url });
  return breadcrumb_list(items);
}

// BreadcrumbList of named items, each with its absolute address (the current page's may be left out).
function breadcrumb_list(items: { name?: string; item?: string }[]): JsonLdNode | null {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => prune({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.item,
    })),
  };
}

// ------------------------------------------------------------
// Blog post — Metadata (an article, with its dates, authors and section) and JSON-LD: BlogPosting, FAQPage when
// the post has a FAQ, BreadcrumbList from `crumbs` (the trail above the post: name + path in the profile).
// ------------------------------------------------------------
const post_path = (ctx: SEO_CONTEXT, post: BlogPost) => profile_path(ctx.country, blog_post_path(post.slug));

export function build_blog_post_metadata(post: BlogPost, ctx: SEO_CONTEXT): Metadata {
  const canonical = post_path(ctx, post);
  const images = post.seo.image ? [resolve_media_url(post.seo.image)] : DEFAULT_OG_IMAGES;
  const description = post.seo.description || undefined;
  const og_description = post.seo.og_description || undefined;

  return {
    title: post.seo.title,
    description,
    alternates: { canonical, languages: ctx.languages },
    openGraph: {
      type: "article",
      title: post.seo.og_title,
      description: og_description,
      images,
      url: canonical,
      siteName: SITE_NAME,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      authors: post.authors.map((author) => author.name),
      section: post.category?.name,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo.og_title,
      description: og_description,
      images,
    },
  };
}

export function build_blog_post_jsonld(
  post: BlogPost,
  ctx: SEO_CONTEXT,
  crumbs: { name: string; path: string }[],
): JsonLdNode[] {
  const url = site_url(post_path(ctx, post));
  const graph: JsonLdNode[] = [
    prune({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.seo.description || undefined,
      image: post.seo.image ? [resolve_media_url(post.seo.image)] : undefined,
      datePublished: post.published_at ?? undefined,
      dateModified: post.updated_at ?? undefined,
      inLanguage: post.language || undefined,
      articleSection: post.category?.name,
      author: post.authors.length
        ? post.authors.map((author) =>
            prune({
              "@type": "Person",
              name: author.name,
              jobTitle: author.role || undefined,
              url: author.slug ? site_url(profile_path(ctx.country, blog_author_path(author.slug))) : undefined,
            }),
          )
        : undefined,
      mainEntityOfPage: url,
      url,
    }),
  ];

  if (post.faq) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faq.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: plain_text(item.answer) },
      })),
    });
  }

  const trail = breadcrumb_list([
    ...crumbs.map((crumb) => ({ name: crumb.name, item: site_url(profile_path(ctx.country, crumb.path)) })),
    { name: post.title, item: url },
  ]);
  if (trail) graph.push(trail);

  return graph;
}

// ------------------------------------------------------------
// Blog list — JSON-LD: the Blog with the posts of the page.
// ------------------------------------------------------------
const card_image = (card: BlogPostCard) => {
  const image = card.cover?.desktop?.image || card.cover?.mobile?.image;
  return image ? resolve_media_url(image) : undefined;
};

export function build_blog_list_jsonld(
  cards: BlogPostCard[],
  ctx: SEO_CONTEXT,
  list: { name: string; category?: string | null; page?: number },
): JsonLdNode {
  return prune({
    "@context": "https://schema.org",
    "@type": "Blog",
    name: list.name,
    url: site_url(profile_path(ctx.country, blog_list_path(list))),
    blogPost: cards.map((card) =>
      prune({
        "@type": "BlogPosting",
        headline: card.title,
        url: site_url(profile_path(ctx.country, blog_post_path(card.slug))),
        datePublished: card.published_at ?? undefined,
        image: card_image(card),
      }),
    ),
  });
}

// ------------------------------------------------------------
// Blog author — Metadata (a profile) and JSON-LD: ProfilePage of the Person, BreadcrumbList from `crumbs`.
// ------------------------------------------------------------
const author_path = (ctx: SEO_CONTEXT, author: BlogAuthorProfile) => profile_path(ctx.country, blog_author_path(author.slug));

export function build_blog_author_metadata(author: BlogAuthorProfile, ctx: SEO_CONTEXT): Metadata {
  const canonical = author_path(ctx, author);
  const description = author.bio || author.role || undefined;
  const images = author.photo ? [resolve_media_url(author.photo)] : DEFAULT_OG_IMAGES;
  return {
    title: author.name,
    description,
    alternates: { canonical, languages: ctx.languages },
    openGraph: { type: "profile", title: author.name, description, images, url: canonical, siteName: SITE_NAME },
  };
}

export function build_blog_author_jsonld(
  author: BlogAuthorProfile,
  ctx: SEO_CONTEXT,
  crumbs: { name: string; path: string }[],
): JsonLdNode[] {
  const url = site_url(author_path(ctx, author));
  const graph: JsonLdNode[] = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      url,
      mainEntity: prune({
        "@type": "Person",
        name: author.name,
        jobTitle: author.role || undefined,
        description: author.bio || undefined,
        image: author.photo ? resolve_media_url(author.photo) : undefined,
        sameAs: author.links.length ? author.links.map((link) => link.url) : undefined,
        url,
      }),
    },
  ];
  const trail = breadcrumb_list([
    ...crumbs.map((crumb) => ({ name: crumb.name, item: site_url(profile_path(ctx.country, crumb.path)) })),
    { name: author.name, item: url },
  ]);
  if (trail) graph.push(trail);
  return graph;
}

// Drop undefined keys so the emitted JSON-LD stays clean.
function prune<T extends object>(obj: T): T {
  const node = obj as Record<string, unknown>;
  for (const k of Object.keys(node)) if (node[k] === undefined) delete node[k];
  return obj;
}
