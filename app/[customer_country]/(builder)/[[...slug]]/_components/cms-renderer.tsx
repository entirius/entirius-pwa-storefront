import React from "react";
import SectionTypeA from "./sections/section-type-a";
import TileTypeA from "./tiles/tile-type-a";
import TileTypeB from "./tiles/tile-type-b";
import type {
  CmsSectionComponent,
  CmsSectionData,
  CmsDocumentContent,
} from "@/types/cms.types";
import { _LOGGER } from "@/lib/logger";

const warned_unknown_types = new Set<string>();

export const cms_components_map: Record<string, CmsSectionComponent> = {
  "section-type-a": SectionTypeA,
  "tile-type-a": TileTypeA,
  "tile-type-b": TileTypeB as CmsSectionComponent,
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
    return null;
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
