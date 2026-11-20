// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { ProfileForm } from "@theme/forms/profile-form";
import type { ProfileFormValues } from "@entirius/storefront-sdk/forms";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { client_update_profile, type Profile } from "@/lib/auth-client";
import { msg } from "@entirius/storefront-sdk/i18n";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

const profile_schema = z.object({
  firstname: z.string().trim().min(1, msg("validation.firstname_required")),
  lastname: z.string().trim().min(1, msg("validation.lastname_required")),
});

export function ProfileEditForm({
  profile,
  onSaved,
  onCancel,
}: {
  profile: Profile;
  onSaved: (profile: Profile) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const form = useForm<ProfileFormValues>({
    // Same nominal zod type-brand cast used across the auth forms.
    resolver: zodResolver(profile_schema as never),
    mode: "onBlur",
    defaultValues: { firstname: profile.firstname, lastname: profile.lastname },
  });

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      const res = await client_update_profile(values);
      if (!res.ok) {
        form.setError("root", {
          message: t("profile.update_failed"),
        });
        return;
      }
      onSaved(res.profile);
    });
  });

  return <ProfileForm form={form} submit={submit} pending={pending} cancel={onCancel} />;
}
