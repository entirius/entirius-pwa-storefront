"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { static_page_query } from "../api.query";
import { render_cms_document } from "./cms-renderer";
import type { CmsDocumentContent } from "@/types/cms.types";

interface Props {
  routes: string[];
}

export function BuilderClient({ routes }: Props) {
  const api = useMemo(() => create_api(make_client_access()), []);
  const { data, isLoading, error } = useQuery(static_page_query(api, { routes }));

  const document = data?.data?.[0] ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <p className="text-sm font-medium text-destructive">
          Error loading page
        </p>
        <p className="text-xs text-muted-foreground">
          {(error as Error).message}
        </p>
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="flex flex-col gap-4">
      {render_cms_document(document.content as CmsDocumentContent)}
    </div>
  );
}
