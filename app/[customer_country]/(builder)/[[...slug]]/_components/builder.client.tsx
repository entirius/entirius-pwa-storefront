// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { pick_static_page, static_page_query } from "../api.query";
import { render_cms_document } from "./cms-renderer";
import type { CmsDocumentContent } from "@/types/cms.types";
import { useI18n } from "@/providers/i18n.provider";
import { PageLoading } from "@/components/ui/spinner";

interface Props {
  routes: string[];
}

export function BuilderClient({ routes }: Props) {
  const { t, language } = useI18n();
  const api = useMemo(() => create_api(make_client_access()), []);
  const { data, isLoading, error } = useQuery(static_page_query(api, { routes, language }));

  const document = pick_static_page(data?.data, language);

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <p className="text-sm font-medium text-destructive">
          {t("page.loading_error")}
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
      {/* CMS documents have no title field for the page heading; the document
          name keeps one H1 per page for screen readers and SEO. */}
      {document.name && <h1 className="sr-only">{document.name}</h1>}
      {render_cms_document(document.content as CmsDocumentContent)}
    </div>
  );
}
