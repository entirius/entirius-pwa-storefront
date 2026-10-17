// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import * as React from "react";
import { Slot } from "radix-ui";
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { CircleHelp } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/providers/i18n.provider";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
}

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

// One look for every form error: a field's message and a form-level (root) error.
const FORM_ERROR = "text-xs text-destructive";
const FIELD_LABEL = "text-xs text-foreground";
const FIELD_HINT = "text-xs text-muted-foreground";
// Top-aligned: in a row of fields, one with a hint or error must not stretch its neighbour's label.
const FIELD_ITEM = "grid content-start gap-1";

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn(FIELD_ITEM, className)}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

function FormLabel({
  className,
  tooltip,
  ...props
}: React.ComponentProps<typeof Label> & { tooltip?: React.ReactNode }) {
  const { error, formItemId } = useFormField();

  const label = (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn(FIELD_LABEL, "data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
  if (!tooltip) return label;
  return (
    <div className="flex items-center gap-1.5">
      {label}
      <FieldTooltip>{tooltip}</FieldTooltip>
    </div>
  );
}

// The (?) next to a label. Opens on hover and focus, and on tap: touch has no hover.
function FieldTooltip({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={t("common.more_info")}
          onClick={() => setOpen((v) => !v)}
          className="relative touch-target rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <CircleHelp className="size-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn(FIELD_HINT, className)}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const { text } = useI18n();
  // Validation messages are catalogue keys; backend messages pass through unchanged.
  const body = error ? text(String(error?.message ?? "")) : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn(FORM_ERROR, className)}
      {...props}
    >
      {body}
    </p>
  );
}

// A form-level error (root error, failed save) outside any field. Renders nothing when empty.
function FormError({ className, children, ...props }: React.ComponentProps<"p">) {
  if (!children) return null;
  return (
    <p role="alert" data-slot="form-error" className={cn(FORM_ERROR, className)} {...props}>
      {children}
    </p>
  );
}

// Fields outside react-hook-form (contact forms): the same label, (?) and hint as FormLabel/FormDescription.
function Field({
  id,
  label,
  hint,
  tooltip,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  tooltip?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-slot="form-item" className={cn(FIELD_ITEM, className)}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id} className={FIELD_LABEL}>
          {label}
        </Label>
        {tooltip && <FieldTooltip>{tooltip}</FieldTooltip>}
      </div>
      {children}
      {hint && (
        <p id={`${id}-hint`} className={FIELD_HINT}>
          {hint}
        </p>
      )}
    </div>
  );
}

// A checkbox with its sentence-long label (consents, options): body size, box aligned to the first line.
const CHECK_LABEL = "flex items-start gap-2 text-sm leading-snug [&>[data-slot=checkbox]]:mt-0.5";

function CheckLabel({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn(CHECK_LABEL, className)} {...props} />;
}

// The title of a form or of a form step, with an optional line under it.
function FormHeading({
  className,
  description,
  ...props
}: React.ComponentProps<"h2"> & { description?: React.ReactNode }) {
  const heading = <h2 data-slot="form-heading" className={cn("text-lg", className)} {...props} />;
  if (!description) return heading;
  return (
    <div className="flex flex-col gap-1">
      {heading}
      <p data-slot="form-heading-description" className="text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

// A group of fields under a FormHeading-styled legend.
function FormSection({
  title,
  className,
  children,
}: {
  title: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className={cn("flex flex-col gap-4", className)}>
      <legend className="mb-1">
        <FormHeading>{title}</FormHeading>
      </legend>
      {children}
    </fieldset>
  );
}

export {
  CHECK_LABEL,
  CheckLabel,
  Field,
  FormHeading,
  FormSection,
  Form,
  FormError,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  useFormField,
};
