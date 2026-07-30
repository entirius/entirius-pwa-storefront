import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageSetItem {
  width: number;
  height: number;
  source: string;
}

interface ImageSetVariant {
  set: ImageSetItem[];
  uid: string;
  meta: { alt: string | null; fileName: string };
  tags: string[];
  image: string;
  width: number;
  height: number;
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
): { uri: string; width: number; height: number; alt: string } | null {
  if (!images_set) return null;
  const variant = images_set.desktop ?? images_set.mobile;
  if (!variant) return null;
  return {
    uri: variant.image,
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
      <Image
        src={image_data.uri}
        alt={image_data.alt}
        width={width}
        height={height}
        className={cn(object_fit_class, className)}
      />
    );
  }

  const ratio =
    custom_aspect_ratio ?? image_data.width / (image_data.height || 1);

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{ aspectRatio: ratio }}
    >
      <Image
        src={image_data.uri}
        alt={image_data.alt}
        fill
        className={object_fit_class}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}
