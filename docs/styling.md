# Styling

Tailwind CSS v4 with shadcn/ui ("new-york" style). Config in `components.json`.

- Colors, radii and fonts come from `@entirius/brand-tokens`. `app/globals.css` is the only file that maps `--brand-*` to semantic names (`background`, `card`, `primary`, `muted-foreground`, `positive`, `highlight`…).
- Components use semantic classes only. `pnpm lint` rejects hex, `rgb()`/`hsl()`/`oklch()` and Tailwind palette classes (`bg-red-500`, `text-white`) in `.ts`/`.tsx`.
- Dark only — no theme toggle; `<html class="dark">` is fixed.
- Icons: `lucide-react`
- Utility: `cn()` from `lib/utils.ts` (clsx + tailwind-merge)
- Add shadcn components: `pnpm dlx shadcn add <component-name>`
