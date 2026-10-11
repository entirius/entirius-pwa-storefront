import { cn } from "@/lib/utils";
import ChildrenWrapper, { type ChildrenLayout } from "../children-wrapper";
import CmsButton, { type CmsButtonData } from "../cms-button";

const section_dyes: Record<
  number,
  {
    container_bg: string;
    title_color: string;
    subtitle_color: string;
    html_text_color: string;
  }
> = {
  1: {
    container_bg: "bg-leading",
    title_color: "text-primary-foreground",
    subtitle_color: "text-primary-foreground/70",
    html_text_color: "#fafafa",
  },
  2: {
    container_bg: "bg-secondary border border-border",
    title_color: "text-foreground",
    subtitle_color: "text-leading",
    html_text_color: "#71717a",
  },
  3: {
    container_bg: "",
    title_color: "text-leading",
    subtitle_color: "text-muted-foreground",
    html_text_color: "#71717a",
  },
};

const section_variants: Record<
  number,
  {
    container: string;
    header: string;
    buttons: string;
    title: string;
    subtitle: string;
    description: string;
    children_layout: ChildrenLayout;
  }
> = {
  1: {
    container: "p-5",
    header: "flex flex-row items-center justify-between",
    buttons: "flex flex-row gap-2",
    title: "text-3xl font-bold",
    subtitle: "text-sm",
    description: "mt-3 text-lg",
    children_layout: "horizontal",
  },
  2: {
    container: "p-5",
    header: "flex flex-row items-center justify-between",
    buttons: "flex flex-row gap-2",
    title: "text-3xl font-bold",
    subtitle: "text-sm",
    description: "mt-3 text-lg",
    children_layout: "grid-2",
  },
  3: {
    container: "p-5",
    header: "flex flex-row items-center justify-between",
    buttons: "flex flex-row gap-2",
    title: "text-3xl font-bold",
    subtitle: "text-sm",
    description: "mt-3 text-lg",
    children_layout: "vertical",
  },
  // Column of links (footer): title above, buttons as a vertical list. A column without buttons
  // (a bottom line, for example) takes the whole row of the grid it sits in.
  4: {
    container: "px-0 py-2",
    header: "flex flex-col gap-3",
    buttons: "flex flex-col items-start gap-1",
    title: "text-sm font-semibold uppercase tracking-wide",
    subtitle: "text-xs",
    description: "text-sm",
    children_layout: "vertical",
  },
};

export default function SectionTypeA({
  children,
  dye = 1,
  variant = 1,
  title,
  subtitle,
  description,
  buttons,
}: {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  buttons?: CmsButtonData[];
  dye?: number;
  variant?: number;
}) {
  const dye_styles = section_dyes[dye] ?? section_dyes[1];
  const variant_styles = section_variants[variant] ?? section_variants[1];
  const spans_row = variant === 4 && !buttons?.length;

  return (
    <div
      className={cn(
        variant_styles.container,
        dye_styles.container_bg,
        spans_row && "col-span-full",
      )}
    >
      <div className={variant_styles.header}>
        <div className="flex-1">
          {title && (
            <h2 className={cn(variant_styles.title, dye_styles.title_color)}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className={cn(variant_styles.subtitle, dye_styles.subtitle_color)}>
              {subtitle}
            </p>
          )}
        </div>
        {buttons && buttons.length > 0 && (
          <div className={variant_styles.buttons}>
            {buttons.map((button) => (
              <CmsButton key={button.url} button={button} />
            ))}
          </div>
        )}
      </div>

      {description && (
        <div
          className={cn("cms-rich-text", variant_styles.description)}
          style={{ color: dye_styles.html_text_color }}
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}

      {children && (
        <ChildrenWrapper layout={variant_styles.children_layout}>
          {children}
        </ChildrenWrapper>
      )}
    </div>
  );
}
