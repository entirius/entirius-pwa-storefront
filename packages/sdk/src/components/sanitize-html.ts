// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import DOMPurify from "isomorphic-dompurify";

const EXTERNAL = /^https?:\/\//i;

// External links open in a new tab without handing over `window.opener`. Set inside DOMPurify, on the parsed
// element: rewriting the sanitised string afterwards can cut a tag inside a quoted attribute and revive markup
// that DOMPurify had neutralised.
const open_in_new_tab = (node: Element) => {
  node.setAttribute("target", "_blank");
  node.setAttribute("rel", "noopener");
};

function new_tab(node: Element) {
  if (node.tagName !== "A" || !EXTERNAL.test(node.getAttribute("href") ?? "")) return;
  open_in_new_tab(node);
}

function every_link_new_tab(node: Element) {
  if (node.tagName === "A") open_in_new_tab(node);
}

// `new_tab_links`: true opens external links in a new tab, "all" every link (a consent line whose page must not
// replace the checkout).
export function sanitize_html(html: string, { new_tab_links = false }: { new_tab_links?: boolean | "all" } = {}): string {
  if (!new_tab_links) return DOMPurify.sanitize(html);
  const hook = new_tab_links === "all" ? every_link_new_tab : new_tab;
  // The hook lives on the shared instance only for this synchronous call.
  DOMPurify.addHook("afterSanitizeAttributes", hook);
  try {
    return DOMPurify.sanitize(html);
  } finally {
    DOMPurify.removeHook("afterSanitizeAttributes", hook);
  }
}
