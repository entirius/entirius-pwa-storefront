import { expect, test } from "@playwright/test";

// WCAG 2.1 AA for the semantic color pairs the storefront actually uses. Colors are
// resolved by the browser from app/globals.css → @entirius/brand-tokens, so a token
// bump that breaks contrast fails here, not in production. Text needs 4.5:1, UI
// boundaries and focus rings 3:1 (WCAG 1.4.11).

type Pair = { fg: string; bg: string; min: number; fg_alpha?: number; bg_alpha?: number };

const TEXT = 4.5;
const UI = 3;

const PAIRS: Record<string, Pair> = {
  "body text on page": { fg: "foreground", bg: "background", min: TEXT },
  "heading on page": { fg: "heading", bg: "background", min: TEXT },
  "body text on card": { fg: "foreground", bg: "card", min: TEXT },
  "body text on popover": { fg: "popover-foreground", bg: "popover", min: TEXT },
  "muted text on page": { fg: "muted-foreground", bg: "background", min: TEXT },
  "muted text on card": { fg: "muted-foreground", bg: "card", min: TEXT },
  "muted text on muted": { fg: "muted-foreground", bg: "muted", min: TEXT },
  "primary button": { fg: "primary-foreground", bg: "primary", min: TEXT },
  "destructive button": { fg: "background", bg: "destructive", min: TEXT },
  "link on page": { fg: "link", bg: "background", min: TEXT },
  "positive text on page": { fg: "positive", bg: "background", min: TEXT },
  "notice text on page": { fg: "notice", bg: "background", min: TEXT },
  "informative text on page": { fg: "informative", bg: "background", min: TEXT },
  "destructive text on page": { fg: "destructive", bg: "background", min: TEXT },
  // Order status badges: `bg-X/15 text-X` on the page (utils/NORMALIZERS/order.normalizer.ts).
  "positive status badge": { fg: "positive", bg: "positive", bg_alpha: 0.15, min: TEXT },
  "notice status badge": { fg: "notice", bg: "notice", bg_alpha: 0.15, min: TEXT },
  "informative status badge": { fg: "informative", bg: "informative", bg_alpha: 0.15, min: TEXT },
  "destructive status badge": { fg: "destructive", bg: "destructive", bg_alpha: 0.15, min: TEXT },
  // Product labels (product-badges.tsx); sale/bestseller reuse the button pairs above.
  "new label": { fg: "background", bg: "informative", min: TEXT },
  "neutral label": { fg: "foreground", bg: "muted", min: TEXT },
  "form control boundary": { fg: "input", bg: "background", min: UI },
  "focus ring": { fg: "ring", bg: "background", min: UI },
  "active indicator": { fg: "highlight", bg: "card", min: UI },
};

test("semantic color pairs meet WCAG AA", async ({ page }) => {
  await page.goto("/");

  const tokens = [...new Set(Object.values(PAIRS).flatMap((p) => [p.fg, p.bg]))];
  // A probe element turns each custom property into a computed rgb()/rgba().
  const resolved = await page.evaluate((names) => {
    const probe = document.createElement("div");
    document.body.append(probe);
    const out: Record<string, string> = {};
    for (const name of names) {
      probe.style.color = `var(--${name})`;
      out[name] = getComputedStyle(probe).color;
    }
    probe.remove();
    return out;
  }, tokens);

  const page_bg = parse(resolved.background);
  const report = Object.entries(PAIRS).map(([label, p]) => {
    // Translucent layers are composited over the page, like the browser paints them.
    const bg = over(with_alpha(parse(resolved[p.bg]), p.bg_alpha), page_bg);
    const fg = over(with_alpha(parse(resolved[p.fg]), p.fg_alpha), bg);
    const ratio = contrast(fg, bg);
    return { label, ratio: Math.round(ratio * 100) / 100, min: p.min, ok: ratio >= p.min };
  });

  expect(report.filter((r) => !r.ok)).toEqual([]);
});

type RGBA = [number, number, number, number];

function parse(css: string): RGBA {
  const m = css.match(/^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/);
  if (!m) throw new Error(`Unsupported computed color: ${css}`);
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
}

function with_alpha([r, g, b, a]: RGBA, alpha?: number): RGBA {
  return [r, g, b, alpha === undefined ? a : a * alpha];
}

function over([r, g, b, a]: RGBA, [br, bg, bb]: RGBA): RGBA {
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1];
}

function luminance([r, g, b]: RGBA): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: RGBA, b: RGBA): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
