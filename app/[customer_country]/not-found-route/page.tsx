// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Rewrite target of proxy.ts for a missing address. Not in APP_ROUTES (utils/route-exists.ts): a direct visit must answer 404.
export { default, generateMetadata } from "@/app/not-found";
