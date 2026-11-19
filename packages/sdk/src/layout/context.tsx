// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LayoutData } from "./types";

const LayoutContext = createContext<LayoutData | null>(null);

export function LayoutProvider({ value, children }: { value: LayoutData; children: ReactNode }) {
  return <LayoutContext value={value}>{children}</LayoutContext>;
}

export function useLayout(): LayoutData {
  const layout = useContext(LayoutContext);
  if (!layout) throw new Error("useLayout must be used within <LayoutProvider>");
  return layout;
}
