// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsTileAccordionProps } from "@entirius/storefront-sdk/cms";
import { RichText } from "@entirius/storefront-sdk/components/rich-text";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@theme/ui/accordion";

// Question and answer pairs; `section-accordion` holds the Accordion root.
export function TileAccordion({ id, entries }: CmsTileAccordionProps) {
  return entries.map((entry, i) => (
    <AccordionItem key={i} value={`${id}-${i}-${entry.label}`}>
      <AccordionTrigger className="text-left">{entry.label}</AccordionTrigger>
      <AccordionContent>
        {entry.html && <RichText html={entry.html} className="text-sm text-muted-foreground" />}
      </AccordionContent>
    </AccordionItem>
  ));
}
