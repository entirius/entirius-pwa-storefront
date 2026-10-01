import React from "react";
import { Accordion } from "@/components/ui/accordion";
import { SectionShell } from "./section-text";

// FAQ-style list: every `tile-accordion` child is one item.
export default function SectionAccordion({
  title,
  description,
  width,
  children,
}: {
  title?: string;
  description?: string;
  width?: string;
  children?: React.ReactNode;
}) {
  return (
    <SectionShell title={title} description={description} width={width}>
      <Accordion type="multiple" className="w-full">
        {children}
      </Accordion>
    </SectionShell>
  );
}
