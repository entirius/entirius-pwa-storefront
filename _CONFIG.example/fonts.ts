// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Default look (styleguide §1): Lexend Deca carries headings and the wordmark (300/400 only, never bold), Inter the
// shop UI. Both are variable fonts: one file each, no weight list.
// Contract and a client example: docs/configuration.md#typefaces-fontsts
import { Inter, Lexend_Deca } from "next/font/google";

const lexend_deca = Lexend_Deca({
  variable: "--font-lexend-deca",
  subsets: ["latin", "latin-ext"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

// Class names for <body>: they define the font variables that app/globals.css maps to the text and heading faces.
export const FONT_CLASSES = `${lexend_deca.variable} ${inter.variable}`;
