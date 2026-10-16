// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client"

import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useI18n } from "@/providers/i18n.provider"

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
// min-h (50svh, stable while the phone's toolbar moves) keeps the footer from jumping up while the content loads (no h-screen, which overshoots).
function PageLoading({ className }: { className?: string }) {
  const { t } = useI18n()
  return (
    <div
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
