// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import type * as React from "react";
import type { Control, FieldValues, Path } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// The storefront's form fields: label (+ optional (?) tooltip), control, optional hint, error.
// A new field uses one of these, not FormField with local classes.

type FieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: React.ReactNode;
  hint?: React.ReactNode;
  tooltip?: React.ReactNode;
};

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  tooltip,
  type = "text",
  autoComplete,
}: FieldProps<T> & { type?: string; autoComplete?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel tooltip={tooltip}>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              autoComplete={autoComplete}
              {...field}
              value={(field.value as string) ?? ""}
            />
          </FormControl>
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  tooltip,
  options,
  onSelect,
}: FieldProps<T> & {
  options: { value: string; label: string }[];
  onSelect?: (value: string) => void;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel tooltip={tooltip}>{label}</FormLabel>
          <Select
            value={(field.value as string) ?? ""}
            onValueChange={(v) => {
              field.onChange(v);
              onSelect?.(v);
            }}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Label beside the box, in body size: it reads as a sentence, not a field caption.
export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  tooltip,
}: FieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-start gap-2">
            <FormControl>
              <Checkbox checked={!!field.value} onCheckedChange={field.onChange} className="mt-0.5" />
            </FormControl>
            <FormLabel tooltip={tooltip} className="text-sm font-normal leading-snug">
              {label}
            </FormLabel>
          </div>
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
