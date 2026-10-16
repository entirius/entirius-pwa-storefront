// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { get_i18n } from "@/lib/i18n/i18n.server";
import { render_cms_document } from "@/app/[customer_country]/(builder)/[[...slug]]/_components/cms-renderer";
import { load_layout_slot, type LayoutSlotName } from "./api.query";

const slot_classes: Record<LayoutSlotName, string> = {
  announcement: "text-center text-sm",
  "before-footer": "mx-auto w-full max-w-7xl px-4",
};

// Renders the contentdb page of a layout slot with the builder's own renderer; nothing when the slot
// has no page. Server-rendered, so the content is in the first HTML and the layout does not shift.
export async function LayoutSlot({ name }: { name: LayoutSlotName }) {
  const { language } = await get_i18n();
  const page = await load_layout_slot(name, language);
  if (!page) return null;

  return (
    <div data-layout-slot={name} className={slot_classes[name]}>
      {render_cms_document(page.content)}
    </div>
  );
}
