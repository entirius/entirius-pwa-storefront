// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { make_server_access } from "@/API/access/api.server-access";
import { resolve_language, resolve_messages, type Overrides } from "./catalogues";
import { create_i18n } from "./translate";

const OVERRIDES_FILE = path.join(process.cwd(), "_CONFIG", "messages.config.json");

// Optional client file: { "<language>": { "<message key>": "text" } }. Missing file = no overrides.
// Read at runtime (not imported) because a static import of an absent file would break the build.
async function read_overrides(): Promise<Overrides> {
  try {
    return JSON.parse(await readFile(OVERRIDES_FILE, "utf8"));
  } catch {
    return {};
  }
}

// The active language is the `lg` cookie the proxy derives from countries.config.json,
// the same value the API layer sends as the `language` query.
export const get_i18n = cache(async () => {
  const language = resolve_language((await make_server_access()).get("lg"));
  const messages = resolve_messages(language, await read_overrides());
  return { ...create_i18n(language, messages), messages };
});
