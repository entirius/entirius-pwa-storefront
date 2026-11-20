// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ConsentModel } from "@entirius/storefront-sdk/forms";
import { TokenLinks } from "@entirius/storefront-sdk/components/token-links";
import { Checkbox } from "@theme/ui/checkbox";
import { CheckLabel } from "@theme/ui/form";

// A form's consent box: the sentence with its privacy link. Extra attributes (`data-*`) go on the label.
export function ConsentField({ consent, ...props }: { consent: ConsentModel } & Record<`data-${string}`, boolean>) {
  return (
    <CheckLabel {...props}>
      <Checkbox checked={consent.checked} onCheckedChange={(v) => consent.set(v === true)} aria-required />
      <span>
        <TokenLinks text={consent.text} links={consent.links} />
      </span>
    </CheckLabel>
  );
}
