// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CmsDocumentContent } from "@/types/cms.types";
import { get_server_api } from "@/lib/seo/server-api";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { load_cms_data } from "./cms-data";
import { render_cms_document } from "./cms-renderer";

// A CMS document (a page, a layout slot, a blog post's body) rendered on the server: its data read first, then
// every block as the theme's part. Its browser parts (carousels, product cards) hydrate on their own; a page that
// shows product cards wraps it in a PrefetchBoundary of cms_content_prefetches for their Omnibus lines.
export async function CmsDocument({ content }: { content: CmsDocumentContent }) {
  const [api, { t, language }] = await Promise.all([get_server_api(), get_i18n()]);
  const cms = await load_cms_data(api, content, { t, language });
  return render_cms_document(content, cms);
}
