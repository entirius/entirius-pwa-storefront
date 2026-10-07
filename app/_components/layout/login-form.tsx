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
import { client_login } from "@/lib/auth-client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DEBUG_MODE } from "@/_CONFIG/app.config.json";

export function LoginForm({
  onSuccess,
  onSwitchToRegister,
  notice,
}: {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  notice?: string | null;
}) {
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
              ? "Incorrect email or password."
              : "Something went wrong. Please try again.",
        });
        return;
      }
      onSuccess();
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-4 p-4">
        {DEBUG_MODE && (
          <div className="flex flex-col gap-2 rounded-md border border-notice/50 bg-notice/10 p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded bg-notice/20 px-1.5 py-0.5 font-semibold tracking-wide text-notice uppercase">
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
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner className="size-4" /> : "Sign in"}
        </Button>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Don&apos;t have an account?{" "}
          <span className="underline">Register</span>
        </button>
      </form>
    </Form>
  );
}
