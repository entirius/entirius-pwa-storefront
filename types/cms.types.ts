// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
