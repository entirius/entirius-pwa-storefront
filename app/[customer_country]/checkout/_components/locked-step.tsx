// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

// Placeholder for the Shipping / Payment / Review steps. Their backend endpoints
// (GET shipping-methods / payment-methods lists, POST orders) currently 500 —
// unlocks once the backend is fixed.
export function LockedStep({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <Lock className="mx-auto mb-3 size-6 text-muted-foreground" />
      <h2 className="text-lg">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        This step isn’t available yet — the shipping &amp; payment service is
        temporarily unavailable. Your address has been saved.
      </p>
      {onBack && (
        <Button variant="outline" className="mt-4" onClick={onBack}>
          Back to address
        </Button>
      )}
    </div>
  );
}
