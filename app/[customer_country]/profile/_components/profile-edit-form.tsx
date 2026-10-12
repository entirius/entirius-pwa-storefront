"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { client_update_profile, type Profile } from "@/lib/auth-client";
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
import { msg } from "@/lib/i18n/translate";
import { useI18n } from "@/providers/i18n.provider";

const profile_schema = z.object({
  firstname: z.string().trim().min(1, msg("validation.firstname_required")),
  lastname: z.string().trim().min(1, msg("validation.lastname_required")),
});
type ProfileFormValues = z.infer<typeof profile_schema>;

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

  return (
    <Form {...form}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="firstname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("address.firstname")}</FormLabel>
              <FormControl>
                <Input autoComplete="given-name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("address.lastname")}</FormLabel>
              <FormControl>
                <Input autoComplete="family-name" {...field} />
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
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner className="size-4" /> : t("common.save")}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("profile.not_persisted")}
        </p>
      </form>
    </Form>
  );
}
