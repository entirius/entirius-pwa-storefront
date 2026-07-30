"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { categories_query } from "./api.query";
import { type CATEGORY, type CONFIG_QUERY } from "./menu-config";
import { LinkDynamic } from "@/lib/link-dynamic";
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

function useApi() {
  return useMemo(() => create_api(make_client_access()), []);
}

// Grandchildren column — fetched lazily once its parent panel mounts (i.e. opens).
function MegamenuColumn({ child }: { child: CATEGORY }) {
  const api = useApi();
  const { data } = useQuery({
    ...categories_query(api, { parent_url_key: child.url_key }),
    enabled: child.has_children,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-w-40">
      <NavigationMenuLink asChild>
        <LinkDynamic
          href={`/catalog/${child.url_key}`}
          className="block font-medium text-foreground"
        >
          {child.name}
        </LinkDynamic>
      </NavigationMenuLink>
      {data?.data?.map((grandchild: CATEGORY) => (
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

// Panel for a single main item — fetches its children when the panel mounts (opens).
function MegamenuPanel({ mainKey }: { mainKey: string }) {
  const api = useApi();
  const { data, isLoading } = useQuery({
    ...categories_query(api, { parent_url_key: mainKey }),
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <Spinner className="size-4 m-4" />;

  return (
    <div className="mx-auto flex max-w-screen-xl flex-wrap gap-6 p-6">
      {data?.data?.map((child: CATEGORY) => (
        <MegamenuColumn key={child.id ?? child.url_key} child={child} />
      ))}
    </div>
  );
}

export function Megamenu({ query }: { query: CONFIG_QUERY }) {
  const api = useApi();
  // Top-level request uses the shared CONFIG_QUERY; deeper levels load lazily.
  const { data, isLoading, isError, error } = useQuery({
    ...categories_query(api, query),
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <Spinner className="size-4" />;
  if (isError)
    return (
      <span className="text-sm text-destructive">
        Error: {(error as Error)?.message}
      </span>
    );

  const mainItems: CATEGORY[] = data?.data ?? [];

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {mainItems.map((item) =>
          item.has_children ? (
            <NavigationMenuItem key={item.id ?? item.url_key}>
              <NavigationMenuTrigger className="capitalize">
                {item.name}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <MegamenuPanel mainKey={item.url_key} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={item.id ?? item.url_key}>
              <NavigationMenuLink
                asChild
                className={navigationMenuTriggerStyle() + " capitalize"}
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
