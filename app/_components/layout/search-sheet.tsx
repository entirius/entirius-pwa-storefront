"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { search_query } from "./search.query";
import { SearchResults } from "./search-results";

const MIN_CHARS = 2;

export function SearchSheet() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  const access = useMemo(() => make_client_access(), []);
  const api = useMemo(() => create_api(access), [access]);
  const currency = access.get("cr") ?? "";

  // Debounce the typed value (~300ms) before it drives the query.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const enabled = debounced.length >= MIN_CHARS;
  const { data, isFetching, isError } = useQuery({
    ...search_query(api, { q: debounced }),
    enabled,
    placeholderData: (prev) => prev,
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQ("");
      setDebounced("");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Search"
          className="cursor-pointer text-foreground"
        >
          <Search />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="top"
        aria-describedby={undefined}
        className="max-h-[85vh] gap-0 overflow-y-auto"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="sr-only">Search</SheetTitle>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <InputGroupText>
                <Search />
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              autoFocus
              placeholder="Search products and categories…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {isFetching && enabled && (
              <InputGroupAddon align="inline-end">
                <Spinner className="size-4" />
              </InputGroupAddon>
            )}
          </InputGroup>
        </SheetHeader>

        <div className="mx-auto w-full max-w-2xl px-4 py-4">
          {!enabled ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Type at least {MIN_CHARS} characters to search.
            </p>
          ) : isError ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Something went wrong. Please try again.
            </p>
          ) : !data ? (
            <div className="flex justify-center py-6">
              <Spinner className="size-5" />
            </div>
          ) : (
            <SearchResults
              data={data}
              currency={currency}
              onNavigate={() => onOpenChange(false)}
              onPhrase={(text) => setQ(text)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
