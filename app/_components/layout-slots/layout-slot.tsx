// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React from "react";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { render_cms_document } from "@/app/[customer_country]/(builder)/[[...slug]]/_components/cms-renderer";
import { load_layout_slot, type LayoutSlotName } from "./api.query";
import { ClientNavigation } from "@/components/ui/sanitize-html";
import { SlotTrack } from "./slot-track.client";

const slot_classes: Record<LayoutSlotName, string> = {
  announcement: "text-center text-sm",
  "before-footer": "mx-auto w-full max-w-(--page-max-width) px-4",
};

// Renders the contentdb page of a layout slot with the builder's own renderer; nothing when the slot
// has no page. Server-rendered, so the content is in the first HTML and the layout does not shift.
// `copies` > 1 repeats the content for a theme's looping ticker: the extra copies are hidden from assistive tech and
// not focusable, and `--slot-copies` on the track gives the theme the loop length (`translateX(-100% / copies)`).
export async function LayoutSlot({ name, copies = 1 }: { name: LayoutSlotName; copies?: number }) {
  const { language } = await get_i18n();
  const page = await load_layout_slot(name, language);
  if (!page) return null;

  const content = render_cms_document(page.content);
  const Navigation = name === "announcement" ? ClientNavigation : React.Fragment;
  if (copies <= 1) {
    return (
      <div data-layout-slot={name} className={slot_classes[name]}>
        <Navigation>{content}</Navigation>
      </div>
    );
  }

  return (
    <div data-layout-slot={name} className={slot_classes[name]}>
      <Navigation>
        <SlotTrack style={{ "--slot-copies": copies } as React.CSSProperties}>
          <div data-slot-item>{content}</div>
          {Array.from({ length: copies - 1 }, (_, index) => (
            <div key={index} data-slot-item data-slot-copy aria-hidden="true" inert>
              {content}
            </div>
          ))}
        </SlotTrack>
      </Navigation>
    </div>
  );
}
