// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { ReactNode } from "react";
import type { CmsPictures, CmsWidth } from "@entirius/storefront-sdk/cms";
import { SectionTypeA } from "@theme/cms/section-type-a";
import { TileTypeA } from "@theme/cms/tile-type-a";
import { TileTypeB } from "@theme/cms/tile-type-b";
import { SectionHeroSlider } from "@theme/cms/section-hero-slider";
import { SectionText } from "@theme/cms/section-text";
import { SectionImageText } from "@theme/cms/section-image-text";
import { SectionAccordion } from "@theme/cms/section-accordion";
import { SectionIconGrid } from "@theme/cms/section-icon-grid";
import { SectionBanner } from "@theme/cms/section-banner";
import { SectionProductSlider } from "@theme/cms/section-product-slider";
import { SectionFaq } from "@theme/cms/section-faq";
import { SectionBlog } from "@theme/cms/section-blog";
import { TileHero } from "@theme/cms/tile-hero";
import { TileTxtBtn } from "@theme/cms/tile-txt-btn";
import { TileAccordion } from "@theme/cms/tile-accordion";
import { TileTitleDescImg } from "@theme/cms/tile-title-desc-img";
import { TileImage } from "@theme/cms/tile-image";
import { TileProduct } from "@theme/cms/tile-product";
import { EnquiryForm } from "@/components/enquiry-form.client";
import { split_enquiry_marker } from "@/lib/enquiry-marker";
import { cms_links } from "@/lib/cms/links";
import { cms_picture, cms_pictures, cms_width, option, spaced, text } from "@/lib/cms/blocks";
import { FAQ_ANCHOR } from "@/utils/NORMALIZERS/blog-post.normalizer";
import type { CmsDocumentContent, CmsSectionData } from "@/types/cms.types";
import { _LOGGER } from "@/lib/logger";
import { DEBUG_MODE } from "@/_CONFIG/app.config.json";
import { blog_section_routes } from "../api.query";
import { blog_posts_key, type CmsData } from "./cms-data";

// A block of the CMS document with what it needs: its data as the editor saved it, the document's data read on the
// server, its tiles (already rendered) and the width it spans (a tile's is its section's).
type Block = { data: CmsSectionData; cms: CmsData; tiles: ReactNode[]; width: CmsWidth };

const NO_PICTURES: CmsPictures = { desktop: null, mobile: null };

const slider_layout = (value: unknown) => (value === "slider" ? "slider" : "grid");

// Each block type the editor offers → the theme's part (`@theme/cms/<type>`) with its props worked out.
export const cms_blocks: Record<string, (block: Block) => ReactNode> = {
  "section-type-a": ({ data, cms, tiles }) => {
    const description = text(data.description);
    const marker = description ? split_enquiry_marker(description) : null;
    return (
      <SectionTypeA
        t={cms.t}
        title={text(data.title)}
        subtitle={text(data.subtitle)}
        description={description}
        enquiry={
          marker && {
            before: text(marker.before),
            form: <EnquiryForm form_type={marker.form_type} slug={marker.slug} />,
            after: text(marker.after),
          }
        }
        links={cms_links(data.buttons, cms.keys)}
        dye={option(data.dye, 1)}
        variant={option(data.variant, 1)}
      >
        {tiles}
      </SectionTypeA>
    );
  },
  "tile-type-a": ({ data, cms }) => (
    <TileTypeA
      t={cms.t}
      title={text(data.title)}
      subtitle={text(data.subtitle)}
      description={text(data.description)}
      links={cms_links(data.buttons, cms.keys)}
      dye={option(data.dye, 1)}
      variant={option(data.variant, 1)}
      pictures={cms_pictures(data.images_set)}
    />
  ),
  "tile-type-b": ({ data, cms }) => {
    const url_key = text(data.url_key);
    return <TileTypeB t={cms.t} url_key={url_key} product={(url_key && cms.by_url_key.get(url_key)) || null} />;
  },
  // Types the CMS editor (entirius-pwa-cms) produces — the zeno/Emporium seed.
  "section-hero-slider": ({ cms, tiles, width }) => (
    <SectionHeroSlider t={cms.t} width={width}>
      {tiles}
    </SectionHeroSlider>
  ),
  "section-text": ({ data, cms, tiles, width }) => (
    <SectionText t={cms.t} title={text(data.title)} description={text(data.description)} width={width}>
      {tiles}
    </SectionText>
  ),
  "section-image-text": ({ data, cms, tiles, width }) => (
    <SectionImageText t={cms.t} width={width} spaced={spaced(data.margin)}>
      {tiles}
    </SectionImageText>
  ),
  "section-accordion": ({ data, cms, tiles }) => (
    <SectionAccordion
      t={cms.t}
      title={text(data.title)}
      description={text(data.description)}
      links={cms_links(data.custom_buttons, cms.keys)}
    >
      {tiles}
    </SectionAccordion>
  ),
  "section-icon-grid": ({ data, cms, tiles }) => (
    <SectionIconGrid t={cms.t} title={text(data.title)}>
      {tiles}
    </SectionIconGrid>
  ),
  "section-banner": ({ data, cms, width }) => (
    <SectionBanner
      t={cms.t}
      width={width}
      spaced={spaced(data.margin)}
      title={text(data.title)}
      description={text(data.description)}
      pictures={cms_pictures(data.images_set) ?? NO_PICTURES}
      links={cms_links(data.custom_buttons, cms.keys)}
      image_first={data.tile_align === "right"}
    />
  ),
  "section-product-slider-via-sku": ({ data, cms, tiles }) => (
    <SectionProductSlider
      t={cms.t}
      title={text(data.title)}
      description={text(data.description)}
      links={cms_links(data.custom_buttons, cms.keys)}
      layout={slider_layout(data.grid)}
    >
      {tiles}
    </SectionProductSlider>
  ),
  // `custom_field` holds the category's url key; nothing when it has no products.
  "section-product-slider-category": ({ data, cms }) => {
    const products = cms.by_category.get(text(data.custom_field)?.trim() ?? "") ?? [];
    if (!products.length) return null;
    return (
      <SectionProductSlider
        t={cms.t}
        title={text(data.title)}
        description={text(data.description)}
        links={cms_links(data.custom_buttons, cms.keys)}
        layout={slider_layout(data.grid)}
      >
        {products.map((product) => (
          <TileProduct key={product.sku} t={cms.t} product={product} />
        ))}
      </SectionProductSlider>
    );
  },
  // Written by AI Studio (an article's questions and answers), not offered in the page editor.
  "section-faq": ({ data, cms }) => {
    const rows = Array.isArray(data.faq_items) ? (data.faq_items as { question?: unknown; answer?: unknown }[]) : [];
    const items = rows.flatMap((row) => {
      const question = text(row?.question);
      return question?.trim() ? [{ question, answer: text(row.answer) ?? "" }] : [];
    });
    return <SectionFaq t={cms.t} title={text(data.title)} items={items} anchor={FAQ_ANCHOR} />;
  },
  "section-blog": ({ data, cms, width }) => (
    <SectionBlog
      t={cms.t}
      title={text(data.title)}
      description={text(data.description)}
      links={cms_links(data.custom_buttons, cms.keys)}
      width={width}
      posts={cms.posts.get(blog_posts_key(blog_section_routes(data.blog_section))) ?? []}
    />
  ),
  "tile-hero": ({ data, cms, width }) => (
    <TileHero
      t={cms.t}
      title={text(data.title)}
      description={text(data.description)}
      pictures={cms_pictures(data.images_set) ?? NO_PICTURES}
      links={cms_links(data.custom_buttons, cms.keys)}
      image_first={data.tile_align === "right"}
      dye={option(data.dye, 1)}
      shape="slide"
      width={width}
    />
  ),
  "tile-txt-btn": ({ data, cms }) => (
    <TileTxtBtn
      t={cms.t}
      title={text(data.title)}
      description={text(data.description)}
      links={cms_links(data.custom_buttons, cms.keys)}
    />
  ),
  // The CMS editor saves the pairs as `accordion_tile: [{label, wysiwyg}]` on one tile; older content kept one pair
  // per tile as its title + description.
  "tile-accordion": ({ data, cms }) => {
    const rows = Array.isArray(data.accordion_tile) && data.accordion_tile.length
      ? (data.accordion_tile as { label?: unknown; wysiwyg?: unknown }[])
      : [{ label: data.title, wysiwyg: data.description }];
    const entries = rows.flatMap((row) => {
      const label = text(row?.label);
      return label ? [{ label, html: text(row.wysiwyg) ?? "" }] : [];
    });
    return <TileAccordion t={cms.t} id={data.id ?? "faq"} entries={entries} />;
  },
  "tile-title-desc-img": ({ data, cms }) => (
    <TileTitleDescImg
      t={cms.t}
      title={text(data.title)}
      description={text(data.description)}
      icon={cms_picture(data.images_set)}
    />
  ),
  "tile-image": ({ data, cms }) => <TileImage t={cms.t} picture={cms_picture(data.images_set)} />,
  // A product picked by SKU; nothing when the channel does not sell it.
  "tile-product": ({ data, cms }) => {
    const product = cms.by_sku.get(text(data.sku)?.trim() ?? "");
    return product ? <TileProduct t={cms.t} product={product} /> : null;
  },
};

const warned_unknown_types = new Set<string>();

export const render_cms_component = (
  data: CmsSectionData,
  index: number,
  cms: CmsData,
  tiles: ReactNode[] = [],
  // A tile's section width.
  section_width?: string,
): ReactNode => {
  const render = cms_blocks[data.core_type];
  if (!render) {
    if (process.env.NODE_ENV !== "production" && !warned_unknown_types.has(data.core_type)) {
      warned_unknown_types.add(data.core_type);
      _LOGGER({ type: "warning", message: `[CMS] Unknown component type: ${data.core_type}` });
    }
    // Make the gap visible while developing; production stays silent.
    return DEBUG_MODE ? (
      <div
        key={data.id ?? `cms-unknown-${index}`}
        className="rounded-md border border-dashed border-destructive p-3 text-xs text-destructive"
      >
        Unknown CMS component: {data.core_type}
      </div>
    ) : null;
  }
  // The wrapper names the type for a client theme (`[data-cms-type="section-hero-slider"] > section`);
  // `display: contents` keeps it out of the layout.
  return (
    <div key={data.id ?? `cms-${index}`} data-cms-type={data.core_type} data-cms-variant={data.variant} className="contents">
      {render({ data, cms, tiles, width: cms_width(section_width ?? data.width) })}
    </div>
  );
};

// The document's sections in order, each with its tiles.
export const render_cms_document = (content: CmsDocumentContent, cms: CmsData): ReactNode => {
  if (!content?.sections_order) return null;

  return content.sections_order.map((section_uid, section_index) => {
    const section = content.sections[section_uid];
    if (!section) return null;

    const tiles = (content.tiles_order?.[section_uid] ?? []).map((tile_uid, tile_index) => {
      const tile = content.tiles?.[tile_uid];
      if (!tile) return null;
      return render_cms_component(tile, tile_index, cms, [], section.width ?? "container");
    });

    return render_cms_component(section, section_index, cms, tiles);
  });
};
