// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { Suspense } from "react";
import type { Metadata } from "next";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { ResetPasswordClient } from "./_components/reset-password.client";

// Not for search engines: the address carries a one-time key.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await get_i18n();
  return {
    title: t("auth.reset_title"),
    robots: { index: false },
  };
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordClient />
    </Suspense>
  );
}
