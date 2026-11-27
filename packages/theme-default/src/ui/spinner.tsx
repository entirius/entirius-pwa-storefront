// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client"

import { Loader2Icon } from "lucide-react"

import { cn } from "@theme/lib/utils"
import { useI18n } from "@entirius/storefront-sdk/i18n/client"

// `decorative`: inside something that already announces the loading (PageLoading, a labelled button).
function Spinner({
  className,
  decorative = false,
  ...props
}: React.ComponentProps<"svg"> & { decorative?: boolean }) {
  const { t } = useI18n()
  const a11y = decorative
    ? { "aria-hidden": true }
    : { role: "status", "aria-label": t("common.loading") }
  return <Loader2Icon {...a11y} className={cn("size-4 animate-spin", className)} {...props} />
}

// The one loading state for a page or a page section: spinner centred in the space it takes, a caption under it.
// min-h (50svh, stable while the phone's toolbar moves) keeps the page from collapsing while the content loads (no
// h-screen, which overshoots). A whole-page loading is marked `data-page-loading`: PageShell keeps the footer hidden
// while it shows, so the footer is not painted under the spinner and then pushed down by the content. `section`: a
// part of a page loading (a checkout step), the footer stays.
function PageLoading({ className, section = false }: { className?: string; section?: boolean }) {
  const { t } = useI18n()
  return (
    <div
      data-page-loading={section ? undefined : ""}
      role="status"
      aria-live="polite"
      className={cn("flex min-h-[50svh] flex-col items-center justify-center gap-3", className)}
    >
      <Spinner decorative className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
    </div>
  )
}

export { PageLoading, Spinner }
