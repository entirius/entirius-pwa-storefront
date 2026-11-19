// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useNotices as useNoticesStore } from "@/stores/notices.store";

// The notices belong to the page they were raised on: another path clears them.
export function useNotices() {
  const notices = useNoticesStore((s) => s.notices);
  const clear = useNoticesStore((s) => s.clear);
  const dismiss = useNoticesStore((s) => s.dismiss);
  const pathname = usePathname();
  const shown_on = useRef(pathname);
  useEffect(() => {
    if (pathname === shown_on.current) return;
    shown_on.current = pathname;
    clear();
  }, [pathname, clear]);
  return { notices, dismiss };
}
