// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// false during the server render and hydration, true afterwards — for UI that
// reads browser-only state (localStorage) and must match the server HTML first.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
