import { Button } from "@/components/ui/button";
import { LinkDynamic } from "@/lib/link-dynamic";

// `internal` is what the CMS editor saves (`custom_buttons[].type`), with the
// CMS link convention in `url`: `/p/<url_key>` product, `/c/<url_key>` category,
// anything else a CMS page route. The other types are explicit targets.
export type CmsButtonType = "internal" | "catalog" | "product" | "cms" | "external";

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

// CMS link convention → storefront route (country prefix added by LinkDynamic).
function resolve_internal(url: string): string {
  const path = url.startsWith("/") ? url : `/${url}`;
  const [, prefix, key] = path.match(/^\/(p|c)\/?([^/?#]*)/) ?? [];
  if (prefix === "p" && key) return `/product/${key}`;
  // `/c/` with no key has no catalog root to land on — the home page lists categories.
  if (prefix === "c") return key ? `/catalog/${key}` : "/";
  return path;
}

export function resolve_cms_href(type: CmsButtonType, url: string): string {
  switch (type) {
    case "internal":
      return resolve_internal(url);
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
  if (!label || !url) return null;
  const href = resolve_cms_href(type, url);
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
      <LinkDynamic href={href}>{label}</LinkDynamic>
    </Button>
  );
}

export function CmsButtons({ buttons }: { buttons?: CmsButtonData[] }) {
  if (!buttons?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((button, i) => (
        <CmsButton key={`${i}-${button.url}`} button={button} />
      ))}
    </div>
  );
}
