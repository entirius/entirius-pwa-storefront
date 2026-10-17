// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// The count on a header icon (cart, wishlist). Nothing until the local store is read after mount (no spinner that
// flashes on every load) and nothing at zero.
export function CountBadge({ count, mounted }: { count: number; mounted: boolean }) {
  if (!mounted || count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
      {count}
    </span>
  );
}
