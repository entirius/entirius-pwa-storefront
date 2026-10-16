// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { create_api } from "@/API/api.context";
import { make_client_access } from "@/API/access/api.client-access";
import { API_CONTACT_FORM_TYPES_ROUTE, API_CONTACT_SUBMIT_ROUTE } from "@/API/api.routes";

// Contact forms (django_contact_forms) are offered only when the channel has a contact-forms key
// (`API_CONTACT_FORMS_KEY` in channels.config.json, sent by proxy.ts as the `cf_key` cookie) AND the
// backend lists the form type: a missing channel or key answers 401, an unknown type is not in the list.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const is_email = (value: string) => EMAIL.test(value);

type FormTypes = { results?: { code: string }[] } | null;

// Codes of the channel's form types; null while unknown, without a key, or when the form API refuses.
export function useContactFormTypes(): string[] | null {
  const api = useMemo(() => create_api(make_client_access()), []);
  const { data } = useQuery({
    queryKey: ["contact-forms", "types"],
    queryFn: async () => {
      const [error, response] = await api.FETCH_METHOD<FormTypes>(API_CONTACT_FORM_TYPES_ROUTE);
      if (error) return null;
      return (response?.results ?? []).map((type) => type.code);
    },
    enabled: typeof document !== "undefined" && document.cookie.includes("cf_key="),
    staleTime: 10 * 60_000,
    retry: false,
  });
  return data ?? null;
}

export function useContactFormAvailable(form_type: string): boolean {
  return useContactFormTypes()?.includes(form_type) === true;
}

export type ContactFormSubmission = {
  form_type: string;
  email: string;
  slug: string;
  language: string;
  code?: string; // the SKU the request is about
  body: Record<string, string | undefined>;
};

// The body of every submission carries the privacy-information consent and the page it came from;
// empty values are dropped. Returns the JSON string the API takes.
export function submission_json(submission: ContactFormSubmission, page_url: string): string {
  const { email, slug, language, code, body } = submission;
  return JSON.stringify({
    email,
    slug,
    language,
    ...(code && { code }),
    body: {
      ...Object.fromEntries(Object.entries(body).filter(([, value]) => value)),
      consent_privacy_info: true,
      page_url,
    },
  });
}

// True when the backend accepted the submission.
export async function send_contact_form(
  api: ReturnType<typeof create_api>,
  submission: ContactFormSubmission,
): Promise<boolean> {
  const [error] = await api.FETCH_METHOD(
    API_CONTACT_SUBMIT_ROUTE.replace("__TYPE__", encodeURIComponent(submission.form_type)),
    { method: "POST", body: submission_json(submission, window.location.href) },
  );
  return !error;
}
