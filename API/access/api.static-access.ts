import type { COOKIE_ACCESS } from "../api";

export function make_static_access(values: {
  channel?: string | null;
  language?: string | null;
  currency?: string | null;
  country?: string | null;
}): COOKIE_ACCESS {
  const map: Record<string, string | null> = {
    ch: values.channel  ?? null,
    lg: values.language ?? null,
    cr: values.currency ?? null,
    ct: values.country  ?? null,
  };
  return {
    get: (name) => map[name] ?? null,
  };
}