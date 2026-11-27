// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useFormContext } from "react-hook-form";
import { RichText } from "@entirius/storefront-sdk/components/rich-text";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";
import { CheckboxField } from "@theme/ui/form-fields";
import type { RegisterFormValues } from "@entirius/storefront-sdk/forms";
import type { RegisterAgreement } from "@/utils/NORMALIZERS/agreement.normalizer";

// One agreement's wording: the backend's HTML summary, its links (terms, privacy) in a new tab so the form stays
// where it is. Checkout's review step draws the same text.
export function AgreementSummary({ html }: { html: string }) {
  return <RichText as="span" html={html} new_tab_links="all" className="[&_a]:underline" />;
}

// The consent boxes of the register form, inside its `<Form>`: one box per backend agreement (`accepted.<slug>`;
// the schema requires the `required` ones), or the shop's own pair plus the newsletter box when the backend has none
// (`agreements` null). The theme places this node and knows none of it.
export function AgreementFields({
  agreements,
  newsletter,
}: {
  agreements: RegisterAgreement[] | null;
  newsletter: boolean;
}) {
  const { t } = useI18n();
  const { control } = useFormContext<RegisterFormValues>();
  if (agreements) {
    return agreements.map((a) => (
      <CheckboxField key={a.slug} control={control} name={`accepted.${a.slug}`} label={<AgreementSummary html={a.html} />} />
    ));
  }
  return (
    <>
      <CheckboxField control={control} name="consent_terms" label={t("auth.accept_terms")} />
      <CheckboxField control={control} name="consent_data" label={t("auth.consent_data")} />
      {newsletter && <CheckboxField control={control} name="newsletter" label={t("newsletter.signup_opt_in")} />}
    </>
  );
}
