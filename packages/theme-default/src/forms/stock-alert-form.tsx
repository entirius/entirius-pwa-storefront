// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import type { StockAlertFormModel } from "@entirius/storefront-sdk/forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";
import { Button } from "@theme/ui/button";
import { Field, FormError, FormHeading } from "@theme/ui/form";
import { HoneypotField } from "@theme/ui/honeypot-field";
import { Input } from "@theme/ui/input";
import { Spinner } from "@theme/ui/spinner";
import { ConsentField } from "@theme/forms/consent-field";

// "Tell me when it is back" for one sold-out SKU: the e-mail and consent, then the saved request with a way to
// change it.
export function StockAlertForm({ state, submit, consent, className, title_line, email, error, saved }: StockAlertFormModel) {
  const { t } = useI18n();
  const id = useId();
  if (saved) {
    return (
      <div data-stock-alert data-stock-alert-state="saved" className={cn("flex flex-col items-start gap-2", className)}>
        <SavedNote fresh={saved.fresh}>{saved.text}</SavedNote>
        <Button type="button" variant="link" className="h-auto p-0 text-sm" onClick={saved.change}>
          {t("stockAlert.saved_change")}
        </Button>
      </div>
    );
  }
  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby={`${id}-title`}
      data-stock-alert
      data-stock-alert-state={state}
      className={cn("surface-outline relative flex flex-col gap-3 text-left", className)}
    >
      <FormHeading id={`${id}-title`} description={title_line}>
        {t("stockAlert.title")}
      </FormHeading>
      <Field id={`${id}-email`} label={t("stockAlert.email")}>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          value={email.value}
          onChange={(e) => email.set(e.target.value)}
          required
        />
      </Field>
      <HoneypotField />
      <ConsentField consent={consent} data-stock-alert-consent />
      {state === "in_stock" && (
        <p role="status" className="text-sm">
          {t("stockAlert.in_stock")}
        </p>
      )}
      <FormError>{error}</FormError>
      <Button type="submit" className="w-full" disabled={state === "sending"}>
        {state === "sending" ? <Spinner className="size-4" /> : t("stockAlert.submit")}
      </Button>
    </form>
  );
}

// A fresh save is announced and takes the focus once (the submit button that had it is gone); a request remembered
// from an earlier visit is plain text, not read out on every page load.
function SavedNote({ fresh, children }: { fresh: boolean; children: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (fresh) ref.current?.focus();
  }, [fresh]);
  return (
    <p ref={ref} role={fresh ? "status" : undefined} tabIndex={-1} className="text-sm outline-none">
      {children}
    </p>
  );
}
