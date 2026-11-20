// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { NewsletterFormModel } from "@entirius/storefront-sdk/forms";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { cn } from "@theme/lib/utils";
import { Button } from "@theme/ui/button";
import { Field, FormError, FormHeading } from "@theme/ui/form";
import { HoneypotField } from "@theme/ui/honeypot-field";
import { Input } from "@theme/ui/input";
import { Spinner } from "@theme/ui/spinner";
import { ConsentField } from "@theme/forms/consent-field";

// The newsletter sign-up in the footer: e-mail and consent; then a line that the confirmation mail is on its way.
export function NewsletterForm({ state, submit, consent, className }: NewsletterFormModel) {
  const { t } = useI18n();
  if (state === "sent") {
    return (
      <p role="status" data-newsletter-sent className={cn("max-w-xs text-sm", className)}>
        {t("newsletter.sent")}
      </p>
    );
  }
  return (
    <form onSubmit={submit} noValidate data-newsletter-form className={cn("relative flex max-w-xs flex-col gap-3", className)}>
      <FormHeading className="text-base text-heading" description={t("newsletter.intro")}>
        {t("newsletter.title")}
      </FormHeading>
      <Field id="newsletter-email" label={t("newsletter.email")}>
        <Input id="newsletter-email" name="email" type="email" autoComplete="email" required />
      </Field>
      <HoneypotField />
      <ConsentField consent={consent} data-newsletter-consent />
      {state === "invalid" && <FormError>{t("newsletter.invalid")}</FormError>}
      {state === "failed" && <FormError>{t("newsletter.failed")}</FormError>}
      <Button type="submit" variant="outline" disabled={state === "sending"}>
        {state === "sending" ? <Spinner className="size-4" /> : t("newsletter.subscribe")}
      </Button>
    </form>
  );
}
