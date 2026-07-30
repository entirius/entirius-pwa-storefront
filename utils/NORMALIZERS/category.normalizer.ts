import type { CATEGORY } from "@/app/_components/layout/menu-config";

function NORM_CATEGORIES_DATA(rows: any): CATEGORY[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row: any) => ({
    id: row.id ?? row.idx,
    url_key: row.url_key,
    name: row.name,
    has_children: Boolean(row.has_children),
  }));
}

export { NORM_CATEGORIES_DATA };
