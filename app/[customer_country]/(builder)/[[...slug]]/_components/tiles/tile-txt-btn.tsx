import { SanitizeHTML } from "@/components/ui/sanitize-html";
import { CmsButtons, type CmsButtonData } from "../cms-button";

// Text tile: title, rich description, buttons.
export default function TileTxtBtn({
  title,
  description,
  custom_buttons,
}: {
  title?: string;
  description?: string;
  custom_buttons?: CmsButtonData[];
}) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl bg-gradient-card p-6">
      {title && <h3 className="text-lg">{title}</h3>}
      {description && (
        <SanitizeHTML html={description} className="text-sm text-muted-foreground" />
      )}
      {custom_buttons?.length ? (
        <div className="mt-auto pt-2">
          <CmsButtons buttons={custom_buttons} />
        </div>
      ) : null}
    </div>
  );
}
