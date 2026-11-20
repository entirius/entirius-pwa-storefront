// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type { ReactNode } from "react";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

// The reset link's page: title, a line of help and the core's form for the new password. The result (done, or a
// link that does not work) is the message page.
export function ResetPasswordPage({ form }: { form: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-3 text-2xl">{t("auth.reset_title")}</h1>
      <p className="mb-6 text-muted-foreground">{t("auth.reset_intro")}</p>
      {form}
    </div>
  );
}
