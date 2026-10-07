// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import CmsImage, { type CmsImagesSet } from "../cms-image";

export default function TileImage({ images_set }: { images_set?: CmsImagesSet }) {
  return (
    <CmsImage
      images_set={images_set}
      aspect_ratio={4 / 3}
      className="rounded-2xl bg-muted"
    />
  );
}
