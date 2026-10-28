// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { LinkDynamic } from "@/lib/link-dynamic";
import { blog_list_path } from "@/lib/blog-paths";
import type { BlogCategory } from "../api.query";
import { PendingLabel } from "./pending-label.client";

// "All" and a tab per category with posts (`?category_url_key=`); the chosen one is the current page. The list keeps
// showing until the chosen one arrives, the clicked tab pulsing meanwhile.
export async function CategoryTabs({ categories, active }: { categories: BlogCategory[]; active: string | null }) {
  if (!categories.length) return null;
  const { t } = await get_i18n();
  const tabs = [{ name: t("blog.all_categories"), url_key: null }, ...categories];
  return (
    <nav aria-label={t("blog.categories")} className="-mx-4 overflow-x-auto px-4 pb-2">
      <ul className="flex gap-2">
        {tabs.map((tab) => {
          const current = tab.url_key === active;
          return (
            <li key={tab.url_key ?? ""} className="shrink-0">
              {/* The reader stays where the tabs are; the list changes under them. */}
              <LinkDynamic
                href={blog_list_path({ category: tab.url_key })}
                scroll={false}
                aria-current={current ? "page" : undefined}
                className={cn(buttonVariants({ variant: current ? "default" : "outline", size: "sm" }), "rounded-chip")}
              >
                <PendingLabel>{tab.name}</PendingLabel>
              </LinkDynamic>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
