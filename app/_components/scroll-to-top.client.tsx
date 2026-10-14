// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Every forward navigation to a new path starts at the top of the page. The App Router resets scroll
// on its own and, in this setup, did not scroll after leaving a long page: with
// `cacheComponents` the previous page stays in the DOM (hidden) and that lookup does not scroll, so a
// page opened from far down a long one kept the old offset. Browser back/forward (popstate) keeps the
// router's own scroll restoration, and a link with a #hash is left to the router.
export function ScrollToTop() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  const traversal = useRef<string | null>(null);

  useEffect(() => {
    const on_popstate = () => {
      traversal.current = window.location.pathname;
    };
    window.addEventListener("popstate", on_popstate);
    return () => window.removeEventListener("popstate", on_popstate);
  }, []);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    const was_traversal = traversal.current === window.location.pathname;
    traversal.current = null;
    if (was_traversal || window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
