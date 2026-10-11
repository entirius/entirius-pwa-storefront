// A message is a string with {placeholders}, or plural forms picked by Intl.PluralRules from `count`.
export type PluralForms = {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};
export type Message = string | PluralForms;
export type Params = Record<string, string | number>;
