// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsSectionAccordionProps } from "@entirius/storefront-sdk/cms";
import { RichText } from "@entirius/storefront-sdk/components/rich-text";
import { Accordion } from "@theme/ui/accordion";
import { CmsButtons } from "@theme/cms/buttons";

// A list of questions (FAQ style) beside its title: every `tile-accordion` child brings its items.
export function SectionAccordion({ title, description, links, children }: CmsSectionAccordionProps) {
  return (
    <section className="w-full py-8">
      <div className="surface grid gap-8 md:grid-cols-[2fr_3fr]">
        {(title || description || links.length > 0) && (
          <header className="flex flex-col gap-3">
            {title && <h2 className="text-3xl md:text-4xl">{title}</h2>}
            {description && <RichText html={description} className="text-muted-foreground" />}
            <CmsButtons links={links} look="outline" />
          </header>
        )}
        <Accordion type="multiple" className="w-full">
          {children}
        </Accordion>
      </div>
    </section>
  );
}
