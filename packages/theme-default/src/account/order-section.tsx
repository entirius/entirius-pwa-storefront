// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ReactNode } from "react";
import { CreditCard, Package, Receipt, Truck } from "lucide-react";

const ICONS = { lines: Package, delivery: Truck, payment: CreditCard, billing: CreditCard, summary: Receipt };

// A section of the order page under its icon and heading.
export function OrderSection({
  icon,
  title,
  children,
}: {
  icon: keyof typeof ICONS;
  title: string;
  children: ReactNode;
}) {
  const Icon = ICONS[icon];
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-3.5 text-primary" />
        </div>
        <h3 className="text-sm">{title}</h3>
      </div>
      {children}
    </section>
  );
}
