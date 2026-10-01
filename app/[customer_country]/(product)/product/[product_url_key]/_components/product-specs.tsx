import type { SpecGroup } from "@/utils/NORMALIZERS/product.normalizer";

// Product parameters from the PIM (see NORM_SPEC_GROUPS). Ungrouped attributes
// go under the section heading itself.
export function ProductSpecs({ groups }: { groups: SpecGroup[] }) {
  if (!groups.length) return null;
  return (
    <section aria-labelledby="product-specs" className="flex flex-col gap-4">
      <h2 id="product-specs" className="text-lg">
        Specifications
      </h2>
      {groups.map((group, i) => (
        <div key={group.name ?? i} className="flex flex-col gap-2">
          {group.name && (
            <h3 className="text-sm text-muted-foreground">{group.name}</h3>
          )}
          <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] text-sm">
            {group.rows.map((row) => (
              <div key={row.name} className="contents">
                <dt className="border-b border-border py-2 pr-6 text-muted-foreground">
                  {row.name}
                </dt>
                <dd className="border-b border-border py-2">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </section>
  );
}
