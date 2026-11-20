// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { RichText } from "@entirius/storefront-sdk/components/rich-text";
import type { CmsSectionShellProps } from "@entirius/storefront-sdk/cms";
import { cn } from "@theme/lib/utils";
import { CmsButtons } from "@theme/cms/buttons";

// The frame most sections share: a heading row (title, description, buttons such as "All chairs") above the
// section's content.
export function SectionShell({ title, description, links, width, children }: CmsSectionShellProps) {
  return (
    <section className={cn("flex flex-col gap-6 py-8", width !== "full_width" && "w-full")}>
      {(title || description || links?.length) && (
        <header data-section-header className="flex flex-wrap items-end justify-between gap-3">
          <div data-section-intro className="flex flex-col gap-1">
            {title && <h2 className="text-3xl md:text-4xl">{title}</h2>}
            {description && <RichText html={description} className="text-muted-foreground" />}
          </div>
          <CmsButtons links={links} look="outline" />
        </header>
      )}
      {children}
    </section>
  );
}
