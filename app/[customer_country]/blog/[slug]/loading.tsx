// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { PageLoading } from "@/components/ui/spinner";

// A post or an author, not the list: on the list a tab or a page only changes the query, and a loading fallback
// there would blank the page and drop the reader at its top.
export default function BlogPostLoading() {
  return <PageLoading />;
}
