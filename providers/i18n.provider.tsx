"use client";

import { createContext, useContext, useMemo } from "react";
import { create_i18n, type I18n, type Messages } from "@/lib/i18n/translate";

const I18nContext = createContext<I18n | null>(null);

// Seeded by the root layout with the messages of the active language, so server and
// client components print the same text.
export function I18nProvider({
  language,
  messages,
  children,
}: {
  language: string;
  messages: Messages;
  children: React.ReactNode;
}) {
  const i18n = useMemo(() => create_i18n(language, messages), [language, messages]);
  return <I18nContext.Provider value={i18n}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}
