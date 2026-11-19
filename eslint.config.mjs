// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Colors come only from the token layer in app/globals.css (the one mapping file
// from @entirius/brand-tokens to semantic names). Components name a role
// (`bg-card`, `text-muted-foreground`, `text-positive`), never a raw value: no hex,
// no rgb()/hsl()/oklch(), no Tailwind palette class (`bg-red-500`, `text-white`).
const PALETTE =
  "(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-[0-9]{2,3}";
const UTILITY =
  "(bg|text|border|ring|fill|stroke|from|via|to|outline|shadow|divide|decoration|accent|caret|placeholder)";
const RAW_COLOR = `(^|[^\\w-])${UTILITY}-(${PALETTE}|black|white)\\b|#[0-9a-fA-F]{3,8}\\b|\\b(rgba?|hsla?|oklch)\\(`;
const RAW_COLOR_MESSAGE =
  "Raw color value. Use a semantic token from app/globals.css (e.g. bg-card, text-positive, var(--border)).";

const THEME_VIA_REGISTRY = "Import theme components through @theme/* so a theme's override applies.";
const NO_CORE_IMPORT = "Packages and themes do not import the core (@/). Take it from @entirius/storefront-sdk or props.";
const SDK_STANDALONE = "The SDK is the contract: it imports neither the core nor a theme.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["tests/**"], // tests assert the computed values on purpose
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=/${RAW_COLOR}/]`, message: RAW_COLOR_MESSAGE },
        { selector: `TemplateElement[value.raw=/${RAW_COLOR}/]`, message: RAW_COLOR_MESSAGE },
      ],
    },
  },
  // Themes and the SDK are published packages: they never reach into the core (`@/`). The core takes components
  // through `@theme/*` only, so a theme's override applies everywhere; the SDK knows no theme at all.
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["packages/**", "theme/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["@entirius/theme-default", "@entirius/theme-default/*"], message: THEME_VIA_REGISTRY }] }],
    },
  },
  {
    files: ["packages/**/*.{ts,tsx}", "theme/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["@/*"], message: NO_CORE_IMPORT }] }],
    },
  },
  {
    files: ["packages/sdk/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/*", "@theme/*", "@entirius/theme-default", "@entirius/theme-default/*"], message: SDK_STANDALONE }] },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
