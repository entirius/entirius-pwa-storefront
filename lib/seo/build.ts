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
import { apply_transform } from "./transforms";
import { profile_path } from "@/lib/profile-path";

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

// Drop undefined keys so the emitted JSON-LD stays clean.
function prune<T extends object>(obj: T): T {
  const node = obj as Record<string, unknown>;
  for (const k of Object.keys(node)) if (node[k] === undefined) delete node[k];
  return obj;
}
