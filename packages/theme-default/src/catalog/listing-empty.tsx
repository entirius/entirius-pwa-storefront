// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useListingPage } from "@entirius/storefront-sdk/catalog/listing";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

// Nothing to show: an empty category offers to tell the customer when products come (blocks.notify_similar).
export function ListingEmpty() {
  const { t } = useI18n();
  const { kind, blocks } = useListingPage();
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center text-muted-foreground" data-catalog-empty>
      <p>{kind === "search" ? t("search.no_results") : t("catalog.no_products")}</p>
      {blocks.notify_similar}
    </div>
  );
}
