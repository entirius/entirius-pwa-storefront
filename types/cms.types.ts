// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { ComponentType } from "react";

// What the renderer gives every CMS component; the block's own fields come on top, and each
// component declares the ones it reads.
export interface CmsSectionBaseProps {
  id?: string;
  children?: React.ReactNode;
  // The parent section's `width`, handed to its tiles.
  section_width?: string;
}

// A section or tile as the CMS editor saves it: JSON whose fields depend on `core_type`.
export interface CmsSectionData {
  core_type: string;
  id?: string;
  // Section layout option, see cms-width.ts.
  width?: string;
  [key: string]: unknown;
}

export interface CmsDocumentContent {
  sections: Record<string, CmsSectionData>;
  tiles: Record<string, CmsSectionData>;
  sections_order: string[];
  tiles_order: Record<string, string[]>;
  document_configs?: Record<string, unknown>;
}

// A published contentdb page, as the static-page endpoint returns it.
export interface CmsPage {
  name?: string;
  language: string;
  routes: string[];
  meta?: { title?: string; description?: string };
  content: CmsDocumentContent;
}

export type CmsSectionComponent = ComponentType<CmsSectionBaseProps>;
