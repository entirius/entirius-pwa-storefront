// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsTileImageProps } from "@entirius/storefront-sdk/cms";
import { CmsImage } from "@theme/cms/picture";

// One picture, 4:3 with rounded corners.
export function TileImage({ picture }: CmsTileImageProps) {
  return <CmsImage picture={picture} ratio={4 / 3} className="rounded-4xl bg-muted" />;
}
