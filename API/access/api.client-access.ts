import type { COOKIE_ACCESS } from "../api";

export function make_client_access(): COOKIE_ACCESS {
  return {
    get: (name) => {
      if (typeof document === "undefined") return null;
      const match = document.cookie.match(
        new RegExp(`(?:^|; )${name}=([^;]*)`)
      );
      return match ? decodeURIComponent(match[1]) : null;
    },
    set: (name, value) => {
      // 30d so auth tokens survive a browser restart (login + engine refresh writes).
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 30}; Secure; SameSite=Lax`;
    },
    delete: (name) => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    },
  };
}