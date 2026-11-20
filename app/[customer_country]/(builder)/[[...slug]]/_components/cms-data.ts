// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { BlogPostCardModel } from "@entirius/storefront-sdk/blog";
import type { Translate } from "@entirius/storefront-sdk/i18n";
import type { ProductCardData } from "@entirius/storefront-sdk/product/card";
import type { create_api } from "@/API/api.context";
import type { CmsDocumentContent } from "@/types/cms.types";
import { link_keys, load_url_key } from "@/lib/url-keys";
import { blog_card_model } from "@/lib/blog-models";
import { NORM_PRODUCTS_DATA } from "@/utils/NORMALIZERS/product.normalizer";
import {
  blog_section_routes,
  load_category_products,
  load_cms_blog_posts,
  load_products_by_sku,
  load_products_by_url_key,
} from "../api.query";
import { aggregate_categories, aggregate_skus, aggregate_url_keys } from "./cms-product-aggregation.config";

type Api = ReturnType<typeof create_api>;

// Everything a CMS document's blocks show, read on the server before it renders: button addresses in the active
// language's url keys, products by url key, by SKU and of a category, the posts of blog sections. A failed request
// leaves its blocks out (a product the channel does not sell, a missing post), never the page.
export type CmsData = {
  t: Translate;
  language: string;
  // The active language's url key by `<kind>:<typed key>`.
  keys: ReadonlyMap<string, string>;
  by_url_key: ReadonlyMap<string, ProductCardData>;
  by_sku: ReadonlyMap<string, ProductCardData>;
  by_category: ReadonlyMap<string, ProductCardData[]>;
  // A blog section's posts by its routes (blog_posts_key).
  posts: ReadonlyMap<string, BlogPostCardModel[]>;
};

export const blog_posts_key = (routes: string[]) => routes.join("\n");

export async function load_cms_data(
  api: Api,
  content: CmsDocumentContent,
  { t, language }: { t: Translate; language: string },
): Promise<CmsData> {
  const url_keys = aggregate_url_keys(content);
  const skus = aggregate_skus(content);
  const categories = aggregate_categories(content);
  const blog_sections = [
    ...new Map(
      Object.values(content.sections ?? {})
        .filter((section) => section.core_type === "section-blog")
        .map((section) => blog_section_routes(section.blog_section))
        .filter((routes) => routes.length)
        .map((routes) => [blog_posts_key(routes), routes] as const),
    ).values(),
  ];

  const [keys, by_url_key, by_sku, by_category, posts] = await Promise.all([
    Promise.all(
      link_keys(content).map(async ({ kind, key }) => [`${kind}:${key}`, await load_url_key(api, language, kind, key)] as const),
    ),
    url_keys.length
      ? load_products_by_url_key(api, url_keys)
          .then((rows) =>
            NORM_PRODUCTS_DATA(rows).flatMap((product, i) =>
              [product.url_key, ...Object.values(rows[i].url_keys ?? {})].map((key) => [key, product] as const),
            ),
          )
          .catch(() => [])
      : [],
    skus.length
      ? load_products_by_sku(api, skus)
          .then(NORM_PRODUCTS_DATA)
          .catch(() => [])
      : [],
    Promise.all(
      categories.map(async (category) => {
        const rows = await load_category_products(api, category).catch(() => []);
        return [category, NORM_PRODUCTS_DATA(rows)] as const;
      }),
    ),
    Promise.all(
      blog_sections.map(async (routes) => {
        const cards = await load_cms_blog_posts(api, routes, language);
        return [blog_posts_key(routes), cards.map((card) => blog_card_model(card, language))] as const;
      }),
    ),
  ]);

  return {
    t,
    language,
    keys: new Map(keys),
    by_url_key: new Map(by_url_key),
    by_sku: new Map(by_sku.map((product) => [product.sku, product])),
    by_category: new Map(by_category),
    posts: new Map(posts),
  };
}
