// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cn } from "@/lib/utils";
import { SanitizeHTML } from "@/components/ui/sanitize-html";
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
    container_bg: "bg-gradient-backdrop",
    title_color: "text-heading",
    subtitle_color: "text-foreground",
    html_text_color: "var(--foreground)",
  },
  2: {
    container_bg: "bg-card bg-gradient-card border border-border",
    title_color: "text-heading",
    subtitle_color: "text-link",
    html_text_color: "var(--muted-foreground)",
  },
  3: {
    container_bg: "",
    title_color: "text-heading",
    subtitle_color: "text-muted-foreground",
    html_text_color: "var(--muted-foreground)",
  },
};

const section_variants: Record<
  number,
  {
    container: string;
    header: string;
    title: string;
    subtitle: string;
    description: string;
    children_layout: ChildrenLayout;
  }
> = {
  1: {
    container: "p-5",
    header: "flex flex-row items-center justify-between",
    title: "text-3xl font-bold",
    subtitle: "text-sm",
    description: "mt-3 text-lg",
    children_layout: "horizontal",
  },
  2: {
    container: "p-5",
    header: "flex flex-row items-center justify-between",
    title: "text-3xl font-bold",
    subtitle: "text-sm",
    description: "mt-3 text-lg",
    children_layout: "grid-2",
  },
  3: {
    container: "p-5",
    header: "flex flex-row items-center justify-between",
    title: "text-3xl font-bold",
    subtitle: "text-sm",
    description: "mt-3 text-lg",
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

  return (
    <div className={cn(variant_styles.container, dye_styles.container_bg)}>
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
          <div className="flex flex-row gap-2">
            {buttons.map((button) => (
              <CmsButton key={button.url} button={button} />
            ))}
          </div>
        )}
      </div>

      {description && (
        <SanitizeHTML
          html={description}
          className={cn("prose prose-sm max-w-none", variant_styles.description)}
          style={{ color: dye_styles.html_text_color }}
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
