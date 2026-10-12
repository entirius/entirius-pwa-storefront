// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React from "react";
import { Accordion } from "@/components/ui/accordion";
import { SanitizeHTML } from "@/components/ui/sanitize-html";
import { CmsButtons, type CmsButtonData } from "../cms-button";

// FAQ-style list: every `tile-accordion` child is one item.
export default function SectionAccordion({
  title,
  description,
  custom_buttons,
  children,
}: {
  title?: string;
  description?: string;
  width?: string;
  custom_buttons?: CmsButtonData[];
  children?: React.ReactNode;
}) {
  return (
    <section className="w-full py-8">
      <div className="grid gap-8 rounded-4xl bg-card p-6 md:grid-cols-[2fr_3fr] md:p-12">
        {(title || description || custom_buttons?.length) && (
          <header className="flex flex-col gap-3">
            {title && <h2 className="text-3xl md:text-4xl">{title}</h2>}
            {description && <SanitizeHTML html={description} className="text-muted-foreground" />}
            <CmsButtons buttons={custom_buttons} variant="outline" />
          </header>
        )}
        <Accordion type="multiple" className="w-full">
          {children}
        </Accordion>
      </div>
    </section>
  );
}
