import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SanitizeHTML } from "@/components/ui/sanitize-html";

// One question/answer pair; `section-accordion` provides the Accordion root.
// The CMS stores the pair as the tile's own title + description.
export default function TileAccordion({
  id,
  title,
  description,
}: {
  id?: string;
  title?: string;
  description?: string;
}) {
  if (!title) return null;
  return (
    <AccordionItem value={id ?? title}>
      <AccordionTrigger className="text-left">{title}</AccordionTrigger>
      <AccordionContent>
        {description && (
          <SanitizeHTML html={description} className="text-sm text-muted-foreground" />
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
