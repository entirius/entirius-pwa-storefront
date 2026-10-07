# Styling

Tailwind CSS v4 with shadcn/ui ("new-york" style). Config in `components.json`.

- Colors, radii and fonts come from `@entirius/brand-tokens`. `app/globals.css` is the only file that maps `--brand-*` to semantic names (`background`, `card`, `primary`, `muted-foreground`, `positive`, `highlight`…).
- Components use semantic classes only. `pnpm lint` rejects hex, `rgb()`/`hsl()`/`oklch()` and Tailwind palette classes (`bg-red-500`, `text-white`) in `.ts`/`.tsx`.
- Light theme by default (the package's `light.*` tokens); `THEME: "dark"` in `_CONFIG/app.config.json` puts `class="dark"` on `<html>` for the brand's dark set. No theme toggle. Status text sits on `bg-<status>-surface` (light tints), never on a translucent `bg-<status>/N`.
- Icons: `lucide-react`
- Utility: `cn()` from `lib/utils.ts` (clsx + tailwind-merge)
- Add shadcn components: `pnpm dlx shadcn add <component-name>`
