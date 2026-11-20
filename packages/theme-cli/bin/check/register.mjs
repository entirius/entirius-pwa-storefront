// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Loaded with `node --import` by `entirius check`: the module hooks that let Node run a theme's TSX outside Next.
import { register } from "node:module";

register("./hooks.mjs", import.meta.url, { data: { root: process.env.ENTIRIUS_THEME_ROOT } });
