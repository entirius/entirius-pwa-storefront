// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// The published `footer` layout extender → link columns. The CMS navigation
// editor stores items (`display_as: megamenu` with `columns[].links[]`, or a
// single `link`); every links column becomes one footer column, a plain link
// item goes into a column of its own.

export type FooterLink = { label: string; href: string; external: boolean };
export type FooterColumn = { heading: string; links: FooterLink[] };

type RawLink = { label?: unknown; link_type?: unknown; link_value?: unknown; sort_order?: unknown };
type RawColumn = RawLink & { type?: unknown; heading?: unknown; links?: unknown };
type RawItem = RawLink & { display_as?: unknown; columns?: unknown };

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const by_order = <T extends { sort_order?: unknown }>(a: T, b: T) =>
  Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
const list = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

// CMS link → storefront path (the country prefix is added by LinkDynamic).
export function resolve_footer_href(link_type: string, value: string): FooterLink["href"] {
  switch (link_type) {
    case "category":
      return value ? `/catalog/${value}` : "/";
    case "product":
      return `/product/${value}`;
    case "page":
      return !value || value === "home" ? "/" : `/${value.replace(/^\//, "")}`;
    default:
      return value || "/";
  }
}

function norm_link(raw: RawLink): FooterLink | null {
  const label = text(raw.label);
  if (!label) return null;
  const href = resolve_footer_href(text(raw.link_type), text(raw.link_value));
  return { label, href, external: /^https?:\/\//.test(href) };
}

export function NORM_FOOTER(response: unknown): FooterColumn[] {
  const doc = list<{ content?: { items?: unknown } }>(
    (response as { data?: unknown } | undefined)?.data,
  )[0];
  const items = list<RawItem>(doc?.content?.items).sort(by_order);

  return items.flatMap((item): FooterColumn[] => {
    const columns = list<RawColumn>(item.columns)
      .filter((c) => c.type === undefined || c.type === "links")
      .sort(by_order);
    if (!columns.length) {
      const link = norm_link(item);
      return link ? [{ heading: "", links: [link] }] : [];
    }
    return columns
      .map((column) => ({
        heading: text(column.heading) || text(item.label),
        links: list<RawLink>(column.links)
          .sort(by_order)
          .map(norm_link)
          .filter((l): l is FooterLink => l !== null),
      }))
      .filter((column) => column.links.length > 0);
  });
}
