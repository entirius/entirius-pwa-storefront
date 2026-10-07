// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cn } from "@/lib/utils";

export type ProductBadge = { idx: string; name: string };

// Merchandising labels from the backend (`badges`: idx + display name) and the
// percentage off a special price. Colours by idx; an unknown idx gets the
// neutral style, so a new label in the PIM shows up without a code change.
// Pairs are checked by tests/e2e/contrast.spec.ts. Classes stay literal for Tailwind.
const STYLE: Record<string, string> = {
  sale: "bg-destructive text-background",
  new: "bg-informative text-background",
  bestseller: "bg-primary text-primary-foreground",
};
const NEUTRAL = "bg-muted text-foreground";

export function ProductBadges({
  badges,
  percent_off,
  className,
}: {
  badges?: ProductBadge[] | null;
  percent_off?: string | number | null;
  className?: string;
}) {
  const percent = Math.round(Number(percent_off));
  const labels = [
    ...(percent > 0 ? [{ key: "percent", text: `−${percent}%`, style: STYLE.sale }] : []),
    ...(badges ?? []).map((b) => ({
      key: b.idx,
      text: b.name,
      style: STYLE[b.idx] ?? NEUTRAL,
    })),
  ];
  if (!labels.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1", className)} aria-label="Product labels">
      {labels.map((l) => (
        <li
          key={l.key}
          className={cn("rounded px-1.5 py-0.5 text-[11px] leading-none font-medium", l.style)}
        >
          {l.text}
        </li>
      ))}
    </ul>
  );
}
