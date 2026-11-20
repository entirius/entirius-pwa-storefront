// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsTileTxtBtnProps } from "@entirius/storefront-sdk/cms";
import { RichText } from "@entirius/storefront-sdk/components/rich-text";
import { CmsButtons } from "@theme/cms/buttons";

// A text card: title, description, buttons.
export function TileTxtBtn({ title, description, links }: CmsTileTxtBtnProps) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-3xl bg-card bg-gradient-card p-6 md:p-8">
      {title && <h3 className="text-lg">{title}</h3>}
      {description && <RichText html={description} className="text-muted-foreground" />}
      {links.length > 0 && (
        <div className="mt-auto pt-2">
          <CmsButtons links={links} />
        </div>
      )}
    </div>
  );
}
