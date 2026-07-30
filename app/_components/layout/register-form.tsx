"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  register_schema,
  type RegisterFormValues,
} from "@/utils/validation/auth.schema";
import { client_register } from "@/lib/auth-client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";

export function RegisterForm({
  onSwitchToLogin,
  onRegistered,
}: {
  onSwitchToLogin: () => void;
  onRegistered: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<RegisterFormValues>({
    // Same nominal zod type-brand cast as login-form (duplicate zod@4 in the tree).
    resolver: zodResolver(register_schema as never),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
      consent_terms: false,
      consent_data: false,
    },
  });

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      const res = await client_register(values);
      if (!res.ok) {
        form.setError(res.field, { message: res.message });
        return;
      }
      onRegistered();
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-4 p-4">
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
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="consent_terms"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal leading-snug">
                  I accept the terms of service and privacy policy.
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="consent_data"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal leading-snug">
                  I consent to the processing of my personal data.
                </FormLabel>
              </div>
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
          {pending ? <Spinner className="size-4" /> : "Create account"}
        </Button>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Already have an account? <span className="underline">Sign in</span>
        </button>
      </form>
    </Form>
  );
}
