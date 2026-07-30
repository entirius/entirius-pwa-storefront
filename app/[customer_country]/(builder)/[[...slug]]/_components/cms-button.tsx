import Link from "next/link";
import { Button } from "@/components/ui/button";

export type CmsButtonType = "catalog" | "product" | "cms" | "external";

export type CmsButtonDye =
  | "default"
  | "leading"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export interface CmsButtonData {
  url: string;
  label: string;
  type: CmsButtonType;
  dye?: CmsButtonDye;
}

function resolve_href(type: CmsButtonType, url: string): string {
  switch (type) {
    case "catalog":
      return `/catalog/${url}`;
    case "product":
      return `/product/${url}`;
    case "cms":
      return `/${url}`;
    case "external":
      return url;
  }
}

export default function CmsButton({ button }: { button: CmsButtonData }) {
  const { url, label, type, dye = "default" } = button;
  const href = resolve_href(type, url);
  const variant = dye === "leading" ? "default" : dye;

  if (type === "external") {
    return (
      <Button variant={variant} size="sm" asChild>
        <a href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      </Button>
    );
  }

  return (
    <Button variant={variant} size="sm" asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
}
