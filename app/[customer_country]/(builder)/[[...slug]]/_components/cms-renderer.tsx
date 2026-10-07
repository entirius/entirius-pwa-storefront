// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React from "react";
import SectionTypeA from "./sections/section-type-a";
import TileTypeA from "./tiles/tile-type-a";
import TileTypeB from "./tiles/tile-type-b";
import SectionHeroSlider from "./sections/section-hero-slider";
import SectionText from "./sections/section-text";
import SectionAccordion from "./sections/section-accordion";
import TileHero from "./tiles/tile-hero";
import TileTxtBtn from "./tiles/tile-txt-btn";
import TileAccordion from "./tiles/tile-accordion";
import type {
  CmsSectionComponent,
  CmsSectionData,
  CmsDocumentContent,
} from "@/types/cms.types";
import { _LOGGER } from "@/lib/logger";
import { DEBUG_MODE } from "@/_CONFIG/app.config.json";

const warned_unknown_types = new Set<string>();

export const cms_components_map: Record<string, CmsSectionComponent> = {
  "section-type-a": SectionTypeA,
  "tile-type-a": TileTypeA,
  "tile-type-b": TileTypeB as CmsSectionComponent,
  // Types the CMS editor (entirius-pwa-cms) produces — the zeno/Emporium seed.
  "section-hero-slider": SectionHeroSlider,
  "section-text": SectionText,
  // No image field in the data yet; renders as a text section.
  "section-image-text": SectionText,
  "section-accordion": SectionAccordion,
  "tile-hero": TileHero as CmsSectionComponent,
  "tile-txt-btn": TileTxtBtn as CmsSectionComponent,
  "tile-accordion": TileAccordion as CmsSectionComponent,
};

export const render_cms_component = (
  data: CmsSectionData,
  index: number,
  children?: React.ReactNode,
): React.ReactNode => {
  const Component = cms_components_map[data.core_type];
  if (!Component) {
    if (
      process.env.NODE_ENV !== "production" &&
      !warned_unknown_types.has(data.core_type)
    ) {
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
  return (
    <Component key={data.id ?? `cms-${index}`} {...(data as any)}>
      {children}
    </Component>
  );
};

export const render_cms_document = (
  content: CmsDocumentContent,
): React.ReactNode => {
  if (!content?.sections_order) return null;

  return content.sections_order.map((section_uid, section_index) => {
    const section = content.sections[section_uid];
    if (!section) return null;

    const tile_uids = content.tiles_order?.[section_uid] ?? [];
    const rendered_tiles = tile_uids.map((tile_uid, tile_index) => {
      const tile = content.tiles?.[tile_uid];
      if (!tile) return null;
      return render_cms_component(tile, tile_index);
    });

    return render_cms_component(section, section_index, rendered_tiles);
  });
};
