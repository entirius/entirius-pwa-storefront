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

// A published contentdb page, as the static-page endpoint returns it.
export interface CmsPage {
  language: string;
  routes: string[];
  meta?: { title?: string; description?: string };
  content: CmsDocumentContent;
}

export type CmsSectionComponent = ComponentType<CmsSectionBaseProps>;
