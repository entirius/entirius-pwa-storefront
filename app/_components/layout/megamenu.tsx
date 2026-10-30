// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import { useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { categories_query } from "./api.query";
import { type CATEGORY, type CONFIG_QUERY } from "./menu-config";
import { LinkDynamic } from "@/lib/link-dynamic";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { NORM_CATEGORY_BRANCH } from "@/utils/NORMALIZERS/category.normalizer";
import { useI18n } from "@/providers/i18n.provider";

// As tall as their row (the header sets --menu-item), so there is no gap to cross between a trigger and its panel.
// The text lines up with the logo; an open item is underlined, without a filled block or a chevron.
const ROW_ITEM =
  "h-[var(--menu-item)] cursor-pointer rounded-none border-b-2 border-transparent bg-transparent px-0 hover:bg-transparent focus:bg-transparent data-[state=open]:border-primary data-[state=open]:bg-transparent data-[state=open]:hover:bg-transparent data-[state=open]:focus:bg-transparent [&>svg]:hidden";

function useApi() {
  return useMemo(() => create_api(make_client_access()), []);
}

function MegamenuColumn({ child }: { child: CATEGORY }) {
  const { t } = useI18n();

  // The parent's own row spans the columns, above them.
  if (child.is_self) {
    return (
      <NavigationMenuLink asChild>
        <LinkDynamic
          href={`/catalog/${child.url_key}`}
          className="mb-2 w-fit flex-row items-center font-medium text-link [column-span:all]"
        >
          {t("menu.view_all", { name: child.name })}
          <ArrowRight aria-hidden className="text-link" />
        </LinkDynamic>
      </NavigationMenuLink>
    );
  }

  return (
    <div className="mb-4 break-inside-avoid">
      <NavigationMenuLink asChild>
        <LinkDynamic
          href={`/catalog/${child.url_key}`}
          className="block font-medium text-foreground"
        >
          {child.name}
        </LinkDynamic>
      </NavigationMenuLink>
      {child.children?.map((grandchild) => (
        <NavigationMenuLink asChild key={grandchild.id ?? grandchild.url_key}>
          <LinkDynamic
            href={`/catalog/${grandchild.url_key}`}
            className="block text-muted-foreground hover:text-foreground"
          >
            {grandchild.name}
          </LinkDynamic>
        </NavigationMenuLink>
      ))}
    </div>
  );
}

// Panel for a single main item. One response fills every column: `parent_url_key` returns the whole subtree. The
// parent's own row needs no data, so it shows at once, even while the rest loads.
function MegamenuPanel({ main }: { main: CATEGORY }) {
  const api = useApi();
  const { data, isLoading } = useQuery({
    ...categories_query(api, { parent_url_key: main.url_key }),
    refetchOnWindowFocus: false,
  });

  return (
    // Columns fill top to bottom, so a parent with many children leaves no empty row next to it;
    // a parent and its children always stay in one column.
    // `px-2` plus the links' own padding: their text starts where the header's content does.
    <div className="mx-auto w-full max-w-7xl columns-3xs gap-6 px-2 py-6">
      {NORM_CATEGORY_BRANCH(main, data?.data).map((child) => (
        <MegamenuColumn key={child.id ?? child.url_key} child={child} />
      ))}
      {isLoading && <Spinner className="size-4 m-2" />}
    </div>
  );
}

export function Megamenu({ query }: { query: CONFIG_QUERY }) {
  const { t } = useI18n();
  const api = useApi();
  const client = useQueryClient();
  const pointer = useRef("");
  // Top-level request uses the shared CONFIG_QUERY; deeper levels load lazily.
  const { data, isLoading, isError, error } = useQuery({
    ...categories_query(api, query),
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <Spinner className="size-4" />;
  if (isError)
    return (
      <span className="text-sm text-destructive">
        {t("common.error", { message: (error as Error)?.message })}
      </span>
    );

  const mainItems: CATEGORY[] = data?.data ?? [];

  return (
    // Moving between triggers waits like the first opening (no skip delay), so a pointer that crosses a neighbour
    // on its way into the panel does not switch it. The delay stays under Radix's fixed 150 ms close timer:
    // a longer one would blink the panel shut between two triggers.
    <NavigationMenu className="max-w-none justify-start" delayDuration={120} skipDelayDuration={0}>
      <NavigationMenuList className="flex-wrap justify-start gap-x-8 gap-y-0">
        {mainItems.map((item) =>
          item.has_children ? (
            <NavigationMenuItem key={item.id ?? item.url_key}>
              <NavigationMenuTrigger
                className={ROW_ITEM}
                // The data starts loading with the pointer on the trigger, ahead of the panel opening.
                onPointerEnter={() => void client.prefetchQuery(categories_query(api, { parent_url_key: item.url_key }))}
                onPointerDown={(e) => {
                  pointer.current = e.pointerType;
                }}
                // No focus from a mouse press: it would leave the trigger highlighted after the pointer has gone.
                onMouseDown={(e) => e.preventDefault()}
                // Hover opens a panel, so a mouse click could only toggle shut what hover has just opened. Touch and
                // keyboard (`detail` 0) have no hover: their click keeps toggling.
                onClick={(e) => {
                  if (e.detail > 0 && pointer.current === "mouse") e.preventDefault();
                }}
              >
                {item.name}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="p-0 md:w-full">
                <MegamenuPanel main={item} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={item.id ?? item.url_key}>
              <NavigationMenuLink
                asChild
                className={cn(navigationMenuTriggerStyle(), ROW_ITEM)}
              >
                <LinkDynamic href={`/catalog/${item.url_key}`}>
                  {item.name}
                </LinkDynamic>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
