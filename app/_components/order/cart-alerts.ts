// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { CartAlertsModel } from "@entirius/storefront-sdk/cart";
import type { Translate } from "@entirius/storefront-sdk/i18n";
import { cart_error_texts } from "@/utils/cart-errors";
import type { Cart } from "@/utils/NORMALIZERS/cart.normalizer";

// The cart's problems for the theme's CartAlerts: `sync` when the sync failed, the backend's refusals as sentences.
export function cart_alerts(backend: Cart | null | undefined, sync: string | null, t: Translate): CartAlertsModel {
  return {
    sync,
    problems: backend && backend.validation_status !== "valid" ? cart_error_texts(backend.errors, t) : [],
  };
}
