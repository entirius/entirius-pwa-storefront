// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsSectionVideoProps } from "@entirius/storefront-sdk/cms";
import { SectionShell } from "@theme/cms/section-shell";
import { YoutubePlayer } from "@theme/cms/youtube-player";

// A YouTube video by its ID, played on click, over the editor's cover or the video's thumbnail.
export function SectionVideo({ t, id, width, cover }: CmsSectionVideoProps) {
  return (
    <SectionShell t={t} width={width}>
      <YoutubePlayer id={id} cover={cover} />
    </SectionShell>
  );
}
