import { cn } from "@/lib/utils";
import { MediaImage } from "@/components/ui/media-image.client";
import { resolve_media_uri } from "@/utils/NORMALIZERS/media.normalizer";

interface ImageSetItem {
  width: number | null;
  height: number | null;
  source: string;
}

interface ImageSetVariant {
  set: ImageSetItem[];
  uid: string;
  meta: { alt: string | null; fileName: string };
  tags: string[];
  image: string;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export interface CmsImagesSet {
  mobile?: ImageSetVariant;
  desktop?: ImageSetVariant;
}

interface CmsImageProps {
  images_set?: CmsImagesSet;
  className?: string;
  width?: number;
  height?: number;
  content_fit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  aspect_ratio?: number;
}

export function normalize_image_source(
  images_set?: CmsImagesSet,
  prefer: "desktop" | "mobile" = "desktop",
): { uri: string; width: number | null; height: number | null; alt: string } | null {
  if (!images_set) return null;
  const variant =
    prefer === "mobile"
      ? (images_set.mobile ?? images_set.desktop)
      : (images_set.desktop ?? images_set.mobile);
  if (!variant?.image) return null;
  return {
    // CMS uploads come as backend-relative `/media/...` paths, like PIM media.
    uri: resolve_media_uri(variant.image),
    width: variant.width,
    height: variant.height,
    alt: variant.meta?.alt ?? variant.meta?.fileName ?? "",
  };
}

export default function CmsImage({
  images_set,
  className,
  width,
  height,
  content_fit = "cover",
  aspect_ratio: custom_aspect_ratio,
}: CmsImageProps) {
  const image_data = normalize_image_source(images_set);
  if (!image_data) return null;

  const object_fit_class = `object-${content_fit}`;

  if (width && height) {
    return (
      <MediaImage
        src={image_data.uri}
        alt={image_data.alt}
        width={width}
        height={height}
        className={cn(object_fit_class, className)}
      />
    );
  }

  // The CMS often stores no dimensions (null) — fall back to 16:9.
  const ratio =
    custom_aspect_ratio ??
    (image_data.width && image_data.height
      ? image_data.width / image_data.height
      : 16 / 9);

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{ aspectRatio: ratio }}
    >
      <MediaImage
        src={image_data.uri}
        alt={image_data.alt}
        fill
        className={object_fit_class}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}
