// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { AddressLinesModel } from "@entirius/storefront-sdk/account";

// An address as lines: name, street, city, phone.
export function AddressLines({ lines }: { lines: AddressLinesModel }) {
  return (
    <address className="text-sm not-italic text-heading">
      {lines.name}
      <br />
      {lines.street}
      <br />
      {lines.city}
      {lines.phone && (
        <>
          <br />
          <span className="text-muted-foreground">{lines.phone}</span>
        </>
      )}
    </address>
  );
}
