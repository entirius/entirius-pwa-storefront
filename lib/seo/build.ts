import type { Metadata } from "next";
import { DEBUG_MODE } from "@/_CONFIG/app.config.json";
import { _LOGGER } from "@/lib/logger";
import {
  SEO_FIELDS,
  get_path,
  SITE_NAME,
  SITE_URL,
  type SeoField,
  type SEO_CONTEXT,
} from "./config";

// metadataBase absolutizes Metadata fields, but raw JSON-LD is emitted as-is —
// schema.org expects absolute URLs, so build them against SITE_URL here.
const site_url = (path?: string) => (path ? `${SITE_URL}${path}` : undefined);

const first_non_empty = (values: any[]) =>
  values.find((v) => v != null && v !== "");

// ------------------------------------------------------------
// Config-driven core: for each [outKey, source] tuple read the raw object by
// dot-path (or the first non-empty of a fallback array) into a flat bag.
// `pick` optionally filters to a subset of outKeys. No transforms — see config.
// ------------------------------------------------------------
function resolve(
  raw: any,
  fields: SeoField[],
  pick?: string[],
): Record<string, any> {
  const bag: Record<string, any> = {};
  for (const [outKey, source] of fields) {
    if (pick && !pick.includes(outKey)) continue;
    const value = Array.isArray(source)
      ? first_non_empty(source.map((p) => get_path(raw, p)))
      : get_path(raw, source);
    if (value != null && value !== "") {
      bag[outKey] = value;
    } else if (DEBUG_MODE) {
      _LOGGER({
        message: `SEO: field "${outKey}" resolved empty`,
        type: "warning",
        print: { source },
      });
    }
  }
  return bag;
}

type BuildOpts = { pick?: string[] };

// ------------------------------------------------------------
// Product — Metadata
// ------------------------------------------------------------
export function build_product_metadata(
  raw: any,
  ctx: SEO_CONTEXT,
  opts: BuildOpts = {},
): Metadata {
  const bag = resolve(raw, SEO_FIELDS.PRODUCT_META, opts.pick);
  const url_key = bag.url_key ?? ctx.url_key;
  const canonical = url_key ? `/${ctx.country}/product/${url_key}` : undefined;

  return {
    title: bag.title,
    description: bag.description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: bag.title,
      description: bag.description,
      images: bag.images,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: bag.title,
      description: bag.description,
      images: bag.images,
    },
  };
}

// ------------------------------------------------------------
// Product — JSON-LD (schema.org/Product). Nested blocks (offers, brand,
// aggregateRating) are composed only when their fields were picked/resolved.
// ------------------------------------------------------------
export function build_product_jsonld(
  raw: any,
  ctx: SEO_CONTEXT,
  opts: BuildOpts = {},
): Record<string, any> {
  const bag = resolve(raw, SEO_FIELDS.PRODUCT_JSONLD, opts.pick);
  const url_key = bag.url_key ?? ctx.url_key;
  const url = site_url(url_key ? `/${ctx.country}/product/${url_key}` : undefined);

  const jsonLd: Record<string, any> = {
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
  raw: any,
  ctx: SEO_CONTEXT,
  opts: BuildOpts = {},
): Metadata {
  const bag = resolve(raw, SEO_FIELDS.CATALOG_META, opts.pick);
  const url_key = bag.url_key ?? ctx.url_key;
  const canonical = url_key ? `/${ctx.country}/catalog/${url_key}` : undefined;
  const images = bag.image ? [bag.image] : undefined;

  return {
    title: bag.title,
    description: bag.description,
    robots: bag.robots,
    alternates: canonical ? { canonical } : undefined,
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
// Catalog / category — JSON-LD: CollectionPage + BreadcrumbList (from `path`).
// ------------------------------------------------------------
export function build_catalog_jsonld(
  raw: any,
  ctx: SEO_CONTEXT,
  opts: BuildOpts = {},
): Record<string, any>[] {
  const bag = resolve(raw, SEO_FIELDS.CATALOG_JSONLD, opts.pick);
  const url_key = bag.url_key ?? ctx.url_key;

  const graph: Record<string, any>[] = [
    prune({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: bag.title,
      description: bag.description,
      url: site_url(url_key ? `/${ctx.country}/catalog/${url_key}` : undefined),
    }),
  ];

  const trail: any[] = Array.isArray(bag.breadcrumbs) ? bag.breadcrumbs : [];
  if (trail.length) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: trail.map((c: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c?.name,
        item: site_url(c?.url_key ? `/${ctx.country}/catalog/${c.url_key}` : undefined),
      })),
    });
  }

  return graph;
}

// Drop undefined keys so the emitted JSON-LD stays clean.
function prune<T extends Record<string, any>>(obj: T): T {
  for (const k of Object.keys(obj)) if (obj[k] === undefined) delete obj[k];
  return obj;
}
