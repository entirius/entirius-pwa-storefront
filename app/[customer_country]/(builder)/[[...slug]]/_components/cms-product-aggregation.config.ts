import type { CmsDocumentContent, CmsSectionData } from "@/types/cms.types";

export type CmsProductAggregationConfig = Record<string, string[]>;

export const CMS_PRODUCT_AGGREGATION_CONFIG: CmsProductAggregationConfig = {
  "tile-type-b": ["url_key"],
  // "tile-type-c": ["url_key", "related_url_keys"],
};

export const CMS_PRODUCT_AGGREGATED_TYPES = Object.keys(
  CMS_PRODUCT_AGGREGATION_CONFIG,
);

export function aggregate_url_keys(content?: CmsDocumentContent): string[] {
  if (!content) return [];

  const url_keys_set = new Set<string>();

  const extract_from_item = (item: CmsSectionData) => {
    const config_keys = CMS_PRODUCT_AGGREGATION_CONFIG[item.core_type];
    if (!config_keys) return;

    for (const key of config_keys) {
      const value = item[key];
      if (!value) continue;
      if (typeof value === "string") {
        url_keys_set.add(value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => typeof v === "string" && url_keys_set.add(v));
      }
    }
  };

  if (content.sections) Object.values(content.sections).forEach(extract_from_item);
  if (content.tiles) Object.values(content.tiles).forEach(extract_from_item);

  return Array.from(url_keys_set);
}
