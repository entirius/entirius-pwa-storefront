// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { NotifySimilarFormModel } from "@entirius/storefront-sdk/forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";
import { Button } from "@theme/ui/button";
import { Field, FormError, FormHeading } from "@theme/ui/form";
import { HoneypotField } from "@theme/ui/honeypot-field";
import { Input } from "@theme/ui/input";
import { Spinner } from "@theme/ui/spinner";
import { Textarea } from "@theme/ui/textarea";
import { ConsentField } from "@theme/forms/consent-field";

// "Tell me when a similar product arrives": a button that opens the form in place (e-mail, a note, consent).
export function NotifySimilarForm({ state, submit, consent, className, title, open, open_form, trigger_label }: NotifySimilarFormModel) {
  const { t } = useI18n();
  if (!open) {
    return (
      <Button type="button" size="lg" className={cn("w-full", className)} data-notify-trigger onClick={open_form}>
        {trigger_label}
      </Button>
    );
  }
  if (state === "sent") {
    return (
      <p role="status" data-notify-sent className={cn("rounded-2xl border p-4 text-sm", className)}>
        {t("notify.sent")}
      </p>
    );
  }
  return (
    <form
      onSubmit={submit}
      noValidate
      data-notify-form
      className={cn("relative flex flex-col gap-3 rounded-2xl border p-4 text-left", className)}
    >
      <FormHeading>{title}</FormHeading>
      <Field id="notify-email" label={t("notify.email")}>
        <Input id="notify-email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field id="notify-note" label={t("notify.note")} hint={t("notify.note_hint")}>
        <Textarea id="notify-note" name="note" rows={3} aria-describedby="notify-note-hint" />
      </Field>
      <HoneypotField />
      <ConsentField consent={consent} data-notify-consent />
      {state === "invalid" && <FormError>{t("notify.invalid")}</FormError>}
      {state === "failed" && <FormError>{t("notify.failed")}</FormError>}
      <Button type="submit" disabled={state === "sending"}>
        {state === "sending" ? <Spinner className="size-4" /> : t("notify.send")}
      </Button>
    </form>
  );
}
