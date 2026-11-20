// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { EnquiryFormModel } from "@entirius/storefront-sdk/forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";
import { Button } from "@theme/ui/button";
import { Field, FormError, FormHeading } from "@theme/ui/form";
import { HoneypotField } from "@theme/ui/honeypot-field";
import { Input } from "@theme/ui/input";
import { Spinner } from "@theme/ui/spinner";
import { Textarea } from "@theme/ui/textarea";
import { ConsentField } from "@theme/forms/consent-field";

// A question to the shop: name, e-mail, message and consent. On the product page a button stands in until clicked.
export function EnquiryForm({ state, submit, consent, className, id, title, open, open_form, trigger }: EnquiryFormModel) {
  const { t } = useI18n();
  if (!open && trigger) {
    return (
      <Button
        type="button"
        size="lg"
        variant={trigger.primary ? "default" : "outline"}
        className={cn("w-full", className)}
        data-enquiry-trigger
        onClick={open_form}
      >
        {trigger.label}
      </Button>
    );
  }
  if (state === "sent") {
    return (
      <p role="status" data-enquiry-sent className={cn("rounded-2xl border p-4 text-sm", className)}>
        {t("enquiry.sent")}
      </p>
    );
  }
  return (
    <form onSubmit={submit} noValidate data-enquiry-form className={cn("relative flex flex-col gap-3 rounded-2xl border p-4", className)}>
      <FormHeading description={t("enquiry.intro")}>{title}</FormHeading>
      <Field id={`enq-name-${id}`} label={t("enquiry.name")}>
        <Input id={`enq-name-${id}`} name="name" autoComplete="name" required />
      </Field>
      <Field id={`enq-email-${id}`} label={t("enquiry.email")}>
        <Input id={`enq-email-${id}`} name="email" type="email" autoComplete="email" required />
      </Field>
      <Field id={`enq-message-${id}`} label={t("enquiry.message")}>
        <Textarea id={`enq-message-${id}`} name="message" rows={4} required />
      </Field>
      <HoneypotField />
      <ConsentField consent={consent} data-enquiry-consent />
      {state === "invalid" && <FormError>{t("enquiry.invalid")}</FormError>}
      {state === "failed" && <FormError>{t("enquiry.failed")}</FormError>}
      <Button type="submit" disabled={state === "sending"}>
        {state === "sending" ? <Spinner className="size-4" /> : t("enquiry.send")}
      </Button>
    </form>
  );
}
