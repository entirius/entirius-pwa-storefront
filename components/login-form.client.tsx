// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { LoginForm as LoginFormView } from "@theme/forms/login-form";
import type { LoginFormValues } from "@entirius/storefront-sdk/forms";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { login_schema, empty_login_defaults, dummy_login_defaults } from "@/utils/validation/auth.schema";
import { merge_cart_on_login } from "@/stores/cart-login";
import { merge_wishlist_on_login } from "@/stores/wishlist-sync";
import { client_login } from "@/lib/auth-client";
import { throttled_message } from "@/lib/throttling";
import { Button } from "@theme/ui/button";
import { DEBUG_MODE } from "@/_CONFIG/app.config.json";
import { useI18n } from "@entirius/storefront-sdk/i18n/client";

export function LoginForm({
  onSuccess,
  onSwitchToRegister,
  onForgotPassword,
  notice,
}: {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  notice?: string | null;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(login_schema),
    mode: "onBlur",
    // DEBUG starts prefilled with the local test account; Clear empties it.
    defaultValues: DEBUG_MODE ? dummy_login_defaults : empty_login_defaults,
  });

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      const res = await client_login(values);
      if (!res.ok) {
        form.setError("root", {
          message:
            res.error === "invalid_credentials"
              ? t("auth.invalid_credentials")
              : res.error === "throttled"
                ? throttled_message(t, res.retry_after)
                : t("common.try_again"),
        });
        return;
      }
      // Before the app flips to logged in, so the cart sync starts from the merged cart; the device's wishlist
      // joins the account's at the same time.
      await Promise.all([merge_cart_on_login(), merge_wishlist_on_login()]);
      onSuccess();
    });
  });

  return (
    <LoginFormView
      form={form}
      submit={submit}
      pending={pending}
      notice={notice ?? null}
      dev_tools={
        DEBUG_MODE && (
          <div className="flex flex-col gap-2 rounded-md border border-notice/50 bg-notice-surface p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded bg-notice-surface px-1.5 py-0.5 font-semibold tracking-wide text-notice uppercase">
                dev
              </span>
              <Button type="button" variant="outline" size="sm" onClick={() => form.reset(dummy_login_defaults)}>
                Fill test data
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => form.reset(empty_login_defaults)}>
                Clear
              </Button>
            </div>
            <p className="text-notice/80">These tools are only visible because DEBUG_MODE is on.</p>
          </div>
        )
      }
      forgot_password={onForgotPassword}
      register={onSwitchToRegister}
    />
  );
}
