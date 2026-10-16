// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  login_schema,
  empty_login_defaults,
  dummy_login_defaults,
  type LoginFormValues,
} from "@/utils/validation/auth.schema";
import { merge_cart_on_login } from "@/stores/cart-login";
import { client_login } from "@/lib/auth-client";
import {
  Form,
  FormError,
} from "@/components/ui/form";
import { TextField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DEBUG_MODE } from "@/_CONFIG/app.config.json";
import { useI18n } from "@/providers/i18n.provider";

export function LoginForm({
  onSuccess,
  onSwitchToRegister,
  notice,
}: {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  notice?: string | null;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const form = useForm<LoginFormValues>({
    // zodResolver is correct at runtime; the cast bridges a nominal zod type-brand
    // mismatch caused by eslint-config-next pulling a second zod@4 copy into the tree.
    resolver: zodResolver(login_schema as never),
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
              : t("common.try_again"),
        });
        return;
      }
      // Before the app flips to logged in, so the cart sync starts from the merged cart.
      await merge_cart_on_login();
      onSuccess();
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-4 p-4">
        {DEBUG_MODE && (
          <div className="flex flex-col gap-2 rounded-md border border-notice/50 bg-notice-surface p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded bg-notice-surface px-1.5 py-0.5 font-semibold tracking-wide text-notice uppercase">
                dev
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.reset(dummy_login_defaults)}
              >
                Fill test data
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => form.reset(empty_login_defaults)}
              >
                Clear
              </Button>
            </div>
            <p className="text-notice/80">
              These tools are only visible because DEBUG_MODE is on.
            </p>
          </div>
        )}
        {notice && (
          <p className="rounded-md bg-accent p-3 text-sm text-accent-foreground">
            {notice}
          </p>
        )}
        <TextField control={form.control} name="email" label={t("auth.email")} type="email" autoComplete="email" />
        <TextField control={form.control} name="password" label={t("auth.password")} type="password" autoComplete="current-password" />
        <FormError>{form.formState.errors.root?.message}</FormError>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner className="size-4" /> : t("auth.sign_in")}
        </Button>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("auth.no_account")}{" "}
          <span className="underline">{t("auth.register")}</span>
        </button>
      </form>
    </Form>
  );
}
