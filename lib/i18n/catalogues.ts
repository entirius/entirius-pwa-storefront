// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { en } from "@entirius/storefront-sdk/i18n/messages/en";
import { pl } from "@entirius/storefront-sdk/i18n/messages/pl";
import { DEFAULT_LANGUAGE, type Messages } from "@entirius/storefront-sdk/i18n";
import type { Message } from "@entirius/storefront-sdk/i18n";

// Adding a language: one file in ./messages (typed against `en`) and one line here.
const CATALOGUES: Record<string, Messages> = { en, pl };

export type Overrides = Record<string, Record<string, Message>>;

export function resolve_language(raw: string | null | undefined): string {
  const language = raw?.toLowerCase() ?? "";
  return Object.hasOwn(CATALOGUES, language) ? language : DEFAULT_LANGUAGE;
}

// Fallback chain per key: client override, language catalogue, en.
export function resolve_messages(language: string, overrides: Overrides): Messages {
  return { ...en, ...CATALOGUES[language], ...overrides[language] };
}
