// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// A CMS section description can place the enquiry form with a marker element:
//   <div data-enquiry-form data-slug="contact" data-type="general"></div>
// `data-slug` (default "contact") names the form in the inbox, `data-type` (default "general") is the
// contact-forms type it is sent as. The marker is replaced; the rich text around it stays.
const MARKER = /<(\w+)\b[^>]*\bdata-enquiry-form\b[^>]*>(?:\s*<\/\1>)?/i;

export type EnquiryMarker = { before: string; after: string; slug: string; form_type: string };

export function split_enquiry_marker(description: string): EnquiryMarker | null {
  const match = MARKER.exec(description);
  if (!match) return null;
  const attribute = (name: string, fallback: string) =>
    new RegExp(`data-${name}="([\\w-]+)"`).exec(match[0])?.[1] ?? fallback;
  return {
    before: description.slice(0, match.index),
    after: description.slice(match.index + match[0].length),
    slug: attribute("slug", "contact"),
    form_type: attribute("type", "general"),
  };
}
