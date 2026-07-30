import { ComponentType } from "react";

export interface CmsSectionBaseProps {
  id?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export interface CmsSectionData {
  core_type: string;
  id?: string;
  [key: string]: any;
}

export interface CmsDocumentContent {
  sections: Record<string, CmsSectionData>;
  tiles: Record<string, CmsSectionData>;
  sections_order: string[];
  tiles_order: Record<string, string[]>;
  document_configs?: Record<string, any>;
}

export type CmsSectionComponent = ComponentType<CmsSectionBaseProps>;
