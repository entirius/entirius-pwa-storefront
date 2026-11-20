// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { BlogCategoryTab } from "@entirius/storefront-sdk/blog";
import { Link } from "@entirius/storefront-sdk/components/link";
import type { Translate } from "@entirius/storefront-sdk/i18n";
import { cn } from "@theme/lib/utils";
import { buttonVariants } from "@theme/ui/button";
import { PendingLabel } from "@theme/blog/pending-label";

// "All" and a tab per category with posts; the chosen one is the current page. The list keeps showing until the
// chosen one arrives, the clicked tab pulsing meanwhile.
export function CategoryTabs({ t, tabs }: { t: Translate; tabs: BlogCategoryTab[] }) {
  if (tabs.length < 2) return null;
  return (
    <nav aria-label={t("blog.categories")} className="-mx-4 overflow-x-auto px-4 pb-2">
      <ul className="flex gap-2">
        {tabs.map((tab) => (
          <li key={tab.href} className="shrink-0">
            {/* The reader stays where the tabs are; the list changes under them. */}
            <Link
              href={tab.href}
              scroll={false}
              aria-current={tab.current ? "page" : undefined}
              className={cn(buttonVariants({ variant: tab.current ? "default" : "outline", size: "sm" }), "rounded-chip")}
            >
              <PendingLabel>{tab.name}</PendingLabel>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
