// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Typefaces of the shop, loaded through next/font: every font declared here is self-hosted, preloaded and gets a
// metric-matched fallback. A font declared with @font-face in theme.css gets none of that.
//
// Default look (styleguide §1): Lexend Deca carries headings and the wordmark (300/400 only, never bold), Inter the
// shop UI. Both are variable fonts: one file each, no weight list.
//
// A client typeface replaces them: declare it with next/font/local (or next/font/google) under the variable
// --font-family-sans (text) and, when headings differ, --font-family-brand. Example:
//
//   import localFont from "next/font/local";
//   const sans = localFont({ src: "./assets/fonts/my-font.woff2", variable: "--font-family-sans", weight: "100 900" });
//   export const FONT_CLASSES = sans.variable;
//
// next/font needs literal options, so this is a file and not a key of app.config.json.
import { Inter, Lexend_Deca } from "next/font/google";

const lexend_deca = Lexend_Deca({
  variable: "--font-lexend-deca",
  subsets: ["latin", "latin-ext"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

// Class names for <body>: they define the font variables that app/globals.css maps to font-sans / font-brand.
export const FONT_CLASSES = `${lexend_deca.variable} ${inter.variable}`;
