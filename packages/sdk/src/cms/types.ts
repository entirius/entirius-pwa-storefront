// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { ReactNode } from "react";
import type { Translate } from "../i18n/translate";
import type { ProductCardData } from "../product/card";
import type { BlogPostCardModel } from "../blog/types";

// CMS pages, layout slots and blog posts are blocks from the CMS page editor: sections, and tiles inside them. Each
// block type is a part of the theme, `@theme/cms/<type>`, rendered on the server: plain HTML, its data in props the
// core works out (links resolved, products and posts fetched). A part that needs the browser (a carousel, the product
// card) is a client component inside it; such a component reads its words through useI18n(), since a function
// such as `t` cannot reach the browser.

// One picture the editor uploaded: a backend path for <Media>, its size when the CMS knows it.
export type CmsPicture = { src: string; width: number | null; height: number | null; alt: string };

// A block's picture in its desktop and mobile version; a part that shows one picks the other when it is missing.
export type CmsPictures = { desktop: CmsPicture | null; mobile: CmsPicture | null };

// The editor's look of a button (`leading`: the main call to action); null when the editor chose none and the part
// picks its own.
export type CmsButtonLook = "default" | "leading" | "destructive" | "outline" | "secondary" | "ghost" | "link";

// A CMS button with its address worked out: a shop path for <Link> (the core adds the country), or, when
// `external`, a URL for a plain <a>.
export type CmsLink = {
  label: string;
  href: string;
  external: boolean;
  // External links open in a new tab, except an in-page "#fragment".
  new_tab: boolean;
  look: CmsButtonLook | null;
};

// The section's `width` option: the page container, or the whole viewport. Tiles get their section's.
export type CmsWidth = "container" | "full_width";

// Every part gets `t` for words of its own.
type Part = { t: Translate };

// A section's heading row: title, description (HTML) and buttons such as "All chairs".
export type CmsSectionShellProps = Part & {
  title?: string;
  description?: string;
  links?: CmsLink[];
  width?: CmsWidth;
  children?: ReactNode;
};

// `section-text`: title, description and a grid of tiles.
export type CmsSectionTextProps = Part & { title?: string; description?: string; width: CmsWidth; children?: ReactNode };

// `section-image-text`: a `tile-image` beside a `tile-txt-btn`. `spaced`: the editor's `margin`.
export type CmsSectionImageTextProps = Part & { width: CmsWidth; spaced: boolean; children?: ReactNode };

// `section-accordion`: the children are `tile-accordion` items.
export type CmsSectionAccordionProps = Part & {
  title?: string;
  description?: string;
  links: CmsLink[];
  children?: ReactNode;
};

// `section-icon-grid`: up to six `tile-title-desc-img` children.
export type CmsSectionIconGridProps = Part & { title?: string; children?: ReactNode };

// `section-banner`: one picture with copy and buttons, no tiles.
export type CmsSectionBannerProps = Part & {
  width: CmsWidth;
  spaced: boolean;
  title?: string;
  description?: string;
  pictures: CmsPictures;
  links: CmsLink[];
  image_first: boolean;
};

// `section-faq`: an article's questions and answers (HTML), under the anchor its table of contents links to.
export type CmsSectionFaqProps = Part & {
  title?: string;
  items: { question: string; answer: string }[];
  anchor: string;
};

// `section-hero-slider`: the children are slides (`tile-hero`).
export type CmsSectionHeroSliderProps = Part & { width: CmsWidth; children?: ReactNode };

// `section-product-slider-via-sku` (hand-picked `tile-product` children) and `section-product-slider-category`
// (the first products of a category, as `tile-product` parts too). `layout`: one scrolling row or a grid.
export type CmsSectionProductSliderProps = Part & {
  title?: string;
  description?: string;
  links: CmsLink[];
  layout: "slider" | "grid";
  children?: ReactNode;
};

// `section-video`: a YouTube video by its ID, played on click. `cover`: the picture the editor uploaded; without
// one the core serves the video's thumbnail from the shop's own origin (`/video-cover/<id>.jpg`).
export type CmsSectionVideoProps = Part & { id: string; width: CmsWidth; cover?: CmsPicture | null };

// `section-blog`: the posts the editor picked, in the blog's tiles.
export type CmsSectionBlogProps = Part & {
  title?: string;
  description?: string;
  links: CmsLink[];
  width: CmsWidth;
  posts: BlogPostCardModel[];
};

// A form the core renders whole inside a text: the text before and after the editor's form marker.
export type CmsEnquiry = { before?: string; form: ReactNode; after?: string };

// `section-type-a` (older content, and the footer's link columns: `variant` 4). `dye` and `variant` are the
// editor's colour and layout options.
export type CmsSectionTypeAProps = Part & {
  title?: string;
  subtitle?: string;
  description?: string;
  enquiry: CmsEnquiry | null;
  links: CmsLink[];
  dye: number;
  variant: number;
  children?: ReactNode;
};

// `tile-type-a` (older content).
export type CmsTileTypeAProps = Part & {
  title?: string;
  subtitle?: string;
  description?: string;
  links: CmsLink[];
  dye: number;
  variant: number;
  pictures: CmsPictures | null;
};

// `tile-type-b` (older content): a product by url key; null when the shop does not sell it.
export type CmsTileTypeBProps = Part & { url_key?: string; product: ProductCardData | null };

// `tile-hero`: copy beside its picture, a slide or a card (`shape: "banner"`: the `section-banner` strip). `dye`:
// the editor's colour variant (1–5).
export type CmsTileHeroProps = Part & {
  title?: string;
  description?: string;
  pictures: CmsPictures;
  links: CmsLink[];
  image_first: boolean;
  dye: number;
  shape: "slide" | "banner";
  width: CmsWidth;
};

// `tile-txt-btn`: title, description, buttons.
export type CmsTileTxtBtnProps = Part & { title?: string; description?: string; links: CmsLink[] };

// `tile-title-desc-img`: an icon, a title and a short text.
export type CmsTileTitleDescImgProps = Part & { title?: string; description?: string; icon: CmsPicture | null };

// `tile-image`: one picture.
export type CmsTileImageProps = Part & { picture: CmsPicture | null };

// `tile-accordion`: question and answer (HTML) pairs inside `section-accordion`.
export type CmsTileAccordionProps = Part & { id: string; entries: { label: string; html: string }[] };

// `tile-product`: a product picked by SKU, or one of a category section's; the core leaves out a product the
// channel does not sell.
export type CmsTileProductProps = Part & { product: ProductCardData };
