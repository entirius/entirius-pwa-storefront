import Image from "next/image";
import { cn } from "@/lib/utils";
import CmsImage, {
  type CmsImagesSet,
  normalize_image_source,
} from "../cms-image";
import CmsButton, { type CmsButtonData } from "../cms-button";
import type { CmsSectionBaseProps } from "@/types/cms.types";

const tile_dyes: Record<
  number,
  {
    container_bg: string;
    content_bg: string;
    title_color: string;
    subtitle_color: string;
    html_text_color: string;
  }
> = {
  1: {
    container_bg: "bg-card",
    content_bg: "",
    title_color: "text-card-foreground",
    subtitle_color: "text-muted-foreground",
    html_text_color: "#71717a",
  },
  2: {
    container_bg: "bg-leading",
    content_bg: "bg-gradient-to-t from-black/90 to-transparent",
    title_color: "text-white",
    subtitle_color: "text-white/80",
    html_text_color: "#fff",
  },
};

const tile_variants: Record<
  number,
  {
    container: string;
    image: string;
    content: string;
    title: string;
    subtitle: string;
    is_overlay: boolean;
    is_horizontal: boolean;
  }
> = {
  1: {
    container: "overflow-hidden rounded-xl shadow-sm shadow-black/10",
    image: "rounded-t-xl",
    content: "p-2",
    title: "text-base font-semibold",
    subtitle: "text-xs tracking-wide",
    is_overlay: false,
    is_horizontal: false,
  },
  2: {
    container:
      "aspect-square w-full overflow-hidden rounded-xl shadow-sm shadow-black/10",
    image: "",
    content: "flex flex-col justify-end p-4",
    title: "text-base font-bold",
    subtitle: "text-xs",
    is_overlay: true,
    is_horizontal: false,
  },
  3: {
    container: "overflow-hidden rounded-xl flex flex-row items-center px-2",
    image: "",
    content: "flex-1 p-4 flex flex-col justify-center",
    title: "text-base font-semibold",
    subtitle: "text-xs",
    is_overlay: false,
    is_horizontal: true,
  },
};

interface TileTypeAProps extends CmsSectionBaseProps {
  title?: string;
  subtitle?: string;
  description?: string;
  buttons?: CmsButtonData[];
  dye?: number;
  variant?: number;
  images_set?: CmsImagesSet;
}

export default function TileTypeA({
  title,
  subtitle,
  description,
  buttons,
  dye = 1,
  variant = 1,
  images_set,
  children,
}: TileTypeAProps) {
  const dye_styles = tile_dyes[dye] ?? tile_dyes[1];
  const variant_styles = tile_variants[variant] ?? tile_variants[1];
  const image_source = normalize_image_source(images_set);

  if (variant_styles.is_overlay) {
    return (
      <div
        className={cn(
          "relative",
          variant_styles.container,
          dye_styles.container_bg,
        )}
      >
        {image_source && (
          <Image
            src={image_source.uri}
            alt={image_source.alt}
            fill
            className="object-cover rounded-xl"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
        <div
          className={cn(
            "relative z-10",
            variant_styles.content,
            dye_styles.content_bg,
          )}
        >
          {subtitle && (
            <p className={cn(variant_styles.subtitle, dye_styles.subtitle_color)}>
              {subtitle}
            </p>
          )}
          {title && (
            <h3 className={cn(variant_styles.title, dye_styles.title_color)}>
              {title}
            </h3>
          )}
          {description && (
            <div
              className="prose prose-sm max-w-none"
              style={{ color: dye_styles.html_text_color }}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
          {buttons && buttons.length > 0 && (
            <div className="flex flex-row gap-2">
              {buttons.map((b) => (
                <CmsButton key={b.url} button={b} />
              ))}
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }

  if (variant_styles.is_horizontal) {
    return (
      <div className={cn(variant_styles.container, dye_styles.container_bg)}>
        {images_set && (
          <div className="aspect-square rounded-xl overflow-hidden shadow-sm shrink-0 w-[100px]">
            <CmsImage
              images_set={images_set}
              width={100}
              height={100}
              content_fit="cover"
            />
          </div>
        )}
        <div className={variant_styles.content}>
          {subtitle && (
            <p className={cn(variant_styles.subtitle, dye_styles.subtitle_color)}>
              {subtitle}
            </p>
          )}
          {title && (
            <h3 className={cn(variant_styles.title, dye_styles.title_color)}>
              {title}
            </h3>
          )}
          {description && (
            <div
              className="prose prose-sm max-w-none"
              style={{ color: dye_styles.html_text_color }}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
          {buttons && buttons.length > 0 && (
            <div className="mt-1 flex flex-row gap-2">
              {buttons.map((b) => (
                <CmsButton key={b.url} button={b} />
              ))}
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(variant_styles.container, dye_styles.container_bg)}>
      {images_set && (
        <CmsImage
          images_set={images_set}
          className={cn("w-full aspect-[16/10]", variant_styles.image)}
          content_fit="cover"
        />
      )}
      <div className={variant_styles.content}>
        {subtitle && (
          <p className={cn(variant_styles.subtitle, dye_styles.subtitle_color)}>
            {subtitle}
          </p>
        )}
        {title && (
          <h3 className={cn(variant_styles.title, dye_styles.title_color)}>
            {title}
          </h3>
        )}
        {description && (
          <div
            className="prose prose-sm max-w-none"
            style={{ color: dye_styles.html_text_color }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
        {buttons && buttons.length > 0 && (
          <div className="flex flex-row gap-2">
            {buttons.map((b) => (
              <CmsButton key={b.url} button={b} />
            ))}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
