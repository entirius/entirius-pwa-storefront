// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cn } from "@/lib/utils";
import { MediaImage } from "@/components/ui/media-image.client";
import type { BlogAuthor } from "@/utils/NORMALIZERS/blog-post.normalizer";

const SIZES = { md: { px: 56, className: "size-14 text-lg" }, lg: { px: 128, className: "size-32 text-4xl" } };

// The author's photo, or their initials on a tint when there is none.
export function AuthorPhoto({ author, size = "md" }: { author: Pick<BlogAuthor, "name" | "photo">; size?: "md" | "lg" }) {
  const { px, className } = SIZES[size];
  if (author.photo) {
    return (
      <MediaImage
        src={author.photo}
        alt={author.name}
        width={px}
        height={px}
        className={cn(className, "shrink-0 rounded-full object-cover")}
      />
    );
  }
  const initials = author.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return (
    <span
      aria-hidden
      className={cn(className, "flex shrink-0 items-center justify-center rounded-full bg-muted font-brand text-heading")}
    >
      {initials}
    </span>
  );
}
