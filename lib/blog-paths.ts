// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Blog addresses without the profile prefix (LinkDynamic / profile_path() add it): the list with its category tab
// (`?category_url_key=`) and page (`?page=`, left out for the first), a post, an author.

export const BLOG_PATH = "/blog";

export function blog_list_path({ category, page }: { category?: string | null; page?: number } = {}): string {
  const query = new URLSearchParams();
  if (category) query.set("category_url_key", category);
  if (page && page > 1) query.set("page", String(page));
  const search = query.toString();
  return search ? `${BLOG_PATH}?${search}` : BLOG_PATH;
}

export const blog_post_path = (slug: string) => `${BLOG_PATH}/${encodeURIComponent(slug)}`;

export const blog_author_path = (slug: string) => `${BLOG_PATH}/authors/${encodeURIComponent(slug)}`;

// `?page=` of a list as a page number (a repeated parameter counts once): 1 when absent, 0 for anything but a whole
// number from 1.
export function page_param(value: string | string[] | undefined): number {
  const raw = ((Array.isArray(value) ? value[0] : value) ?? "").trim();
  if (raw === "") return 1;
  return /^\d+$/.test(raw) && Number(raw) >= 1 ? Number(raw) : 0;
}

// Page numbers around the current one, `null` for a gap: 1 … 4 5 6 … 12. A gap of one page shows the page.
export function page_numbers(current: number, total: number): (number | null)[] {
  const shown = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const out: (number | null)[] = [];
  shown.forEach((n, i) => {
    const previous = shown[i - 1];
    if (previous !== undefined && n - previous === 2) out.push(previous + 1);
    else if (previous !== undefined && n - previous > 2) out.push(null);
    out.push(n);
  });
  return out;
}
