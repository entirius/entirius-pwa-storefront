// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SanitizeHTML } from "@/components/ui/sanitize-html";

type AccordionEntry = { label?: string; wysiwyg?: string };

// Question/answer pairs; `section-accordion` provides the Accordion root.
// The CMS editor saves them as `accordion_tile: [{label, wysiwyg}]` on one tile;
// older content kept one pair per tile as its title + description.
export default function TileAccordion({
  id,
  title,
  description,
  accordion_tile,
}: {
  id?: string;
  title?: string;
  description?: string;
  accordion_tile?: AccordionEntry[];
}) {
  const entries: AccordionEntry[] = accordion_tile?.length
    ? accordion_tile
    : [{ label: title, wysiwyg: description }];

  return entries.map((entry, i) =>
    entry.label ? (
      <AccordionItem key={i} value={`${id ?? "faq"}-${i}-${entry.label}`}>
        <AccordionTrigger className="text-left">{entry.label}</AccordionTrigger>
        <AccordionContent>
          {entry.wysiwyg && (
            <SanitizeHTML html={entry.wysiwyg} className="text-sm text-muted-foreground" />
          )}
        </AccordionContent>
      </AccordionItem>
    ) : null,
  );
}
