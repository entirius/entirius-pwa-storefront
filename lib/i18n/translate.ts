import type { en } from "./messages/en";
import { format_price } from "./format-price";
import type { Message, Params } from "./types";

// Pure and bundle-light: no catalogue is imported here (type-only), so client components
// receive just the resolved messages of the active language from <I18nProvider>.
export type MessageKey = keyof typeof en;
export type Messages = Record<string, Message>;
export type Translate = (key: MessageKey, params?: Params) => string;

export const DEFAULT_LANGUAGE = "en";

// Identity helper: lets code that stores a key as data (zod messages, API-less errors)
// keep it type-checked. Rendering code turns it into text with `i18n.text()`.
export const msg = (key: MessageKey): MessageKey => key;

function pick_form(language: string, message: Message, params?: Params): string {
  if (typeof message === "string") return message;
  const form = new Intl.PluralRules(language).select(Number(params?.count));
  return message[form] ?? message.other;
}

function interpolate(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    name in params ? String(params[name]) : match,
  );
}

export function create_i18n(language: string, messages: Messages) {
  const t: Translate = (key, params) =>
    interpolate(pick_form(language, messages[key], params), params);
  return {
    language,
    t,
    // For text that is either a message key or already final text (backend errors).
    text: (value: string) =>
      Object.hasOwn(messages, value) ? t(value as MessageKey) : value,
    price: (amount: string | number | null | undefined, currency?: string | null) =>
      format_price(amount, currency, language),
    // An empty or unknown code is printed as it is: Intl.DisplayNames throws on it.
    country: (code: string) => {
      try {
        return new Intl.DisplayNames([language], { type: "region" }).of(code) ?? code;
      } catch {
        return code;
      }
    },
  };
}

export type I18n = ReturnType<typeof create_i18n>;
