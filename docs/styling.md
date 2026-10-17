# Styling

Tailwind CSS v4 with shadcn/ui ("new-york" style). Config in `components.json`.

- Colors, radii and fonts come from `@entirius/brand-tokens`. `app/globals.css` is the only file that maps `--brand-*` to semantic names (`background`, `card`, `primary`, `muted-foreground`, `positive`, `highlight`…).
- Components use semantic classes only. `pnpm lint` rejects hex, `rgb()`/`hsl()`/`oklch()` and Tailwind palette classes (`bg-red-500`, `text-white`) in `.ts`/`.tsx`.
- Light theme by default (the package's `light.*` tokens); `THEME: "dark"` in `_CONFIG/app.config.json` puts `class="dark"` on `<html>` for the brand's dark set. No theme toggle. Status text sits on `bg-<status>-surface` (light tints), never on a translucent `bg-<status>/N`.
- Icons: `lucide-react`
- Utility: `cn()` from `lib/utils.ts` (clsx + tailwind-merge)
- Add shadcn components: `pnpm dlx shadcn add <component-name>`

## Forms

Every field goes through a shared component — never `FormField` / `<label>` with local classes.

| Need | Use |
|---|---|
| Text, select, checkbox field (react-hook-form) | `TextField`, `SelectField`, `CheckboxField` — `components/ui/form-fields.tsx` |
| Field outside react-hook-form (contact forms) | `Field` (label + hint around your control), `CheckLabel` for a checkbox with a sentence — `components/ui/form.tsx` |
| Form or step title, group of fields | `FormHeading`, `FormSection` (fieldset with the heading as legend) |
| Form-level error (root error, failed save) | `FormError` |

- Label: `text-xs font-medium`, foreground colour, 4px above the field (`FormItem` is `gap-1`). A checkbox label is a sentence: `text-sm font-normal`, box aligned to the first line.
- Hint (`hint` prop / `FormDescription`): `text-xs text-muted-foreground` under the field.
- Tooltip (`tooltip` prop): a (?) after the label; opens on hover, focus and tap; 44px hit area (`touch-target`). For a short explanation only — anything the user must read goes into the hint.
- Errors: field messages and `FormError` share `text-xs text-destructive`. Full-width alerts above a form (cart sync, checkout validation) are a separate pattern.
- Heading: `FormHeading` is `text-lg` with the brand face and weight from the base layer.
- Border: fields rest on `--field-border`, lighter than `--input` on purpose (below 3:1); hover darkens it to `--input`, focus to `--ring`. Input, textarea, select trigger, input group, checkbox and radio. A client theme that forces `border-color` on fields overrides this.
- Section containers: `surface` (`surface-sm` for a menu strip, `surface-divided` for one that follows another, `surface-outline` for a bordered card; a bordered list whose rows carry their own padding takes `rounded-lg border`), never local `bg-card rounded-* p-*`; a theme flattens them through the `--surface-*` variables.
- Not surfaces: product tiles and CMS tiles (content cards with their own gradient and hover) and layers above the page (the added-to-cart notice). Selectable option rows (shipping and payment methods, filter options) are `<label>` rows with their own classes on purpose: the whole row is the hit area and shows the selected state, which `CheckLabel` does not.
- Corners: controls of one height share `rounded-control` (`--control-radius`); outlined round icon buttons and text chips take `rounded-chip` (`--chip-radius`); a plain `rounded-full` only for ghost icons, counters, statuses, the checkout stepper, the slider and radios, never for a text button.
- Phone: dialling code and number sit in one `PHONE_ROW` (`components/ui/form.tsx`, `6rem` + the rest) at every width, never stacked; checkout and profile addresses share it.
- Height: `h-9` for input, select and input group, `text-base` on phones and `text-sm` from `md` (16px stops iOS zooming into a field). No local height overrides.

## Stacking and touch

- Stacking (`app/globals.css`): `z-raised` (1, above a picture inside a card), `z-sticky` (30, header and fixed bars),
  `z-toast` (40, the added-to-cart notice), `z-viewer` (60, the full-screen gallery). shadcn overlays (sheets, select,
  tooltip) keep their own `z-50`. No bare `z-10` / `z-[n]` in app code.
- Touch: `--spacing-touch` (2.75rem) is the minimum hit area. `touch-target` grows a small control's hit area without
  changing its look (the element must be positioned); `size-touch` / `min-h-touch` size a control to it, and
  `pointer-coarse:min-h-touch` does so on touch screens only, where rows sit too close for an invisible hit area.
