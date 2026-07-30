import { create_fetch_engine } from "./api.setup";
import type { COOKIE_ACCESS } from "./api.d.ts";

export function create_api(cookie_access: COOKIE_ACCESS) {
  const access = {
    get_language: () => cookie_access.get("lg"),
    get_currency: () => cookie_access.get("cr"),
    get_country: () => cookie_access.get("ct"),
    get_channel: () => cookie_access.get("ch"),
    get_access_token: () => cookie_access.get("at"),
    get_refresh_token: () => cookie_access.get("rt"),
    get_user_id: () => cookie_access.get("uid"),
    get_cart_id: () => cookie_access.get("cid"),
    get_channel_checkout_key: () => cookie_access.get("ch_key"),
    set_tokens: (tokens: { access_token: string; refresh_token: string }) => {
      cookie_access.set?.("at", tokens.access_token);
      cookie_access.set?.("rt", tokens.refresh_token);
    },
    clear_tokens: () => {
      cookie_access.delete?.("at");
      cookie_access.delete?.("rt");
      cookie_access.delete?.("uid");
    },
  };

  const FETCH_METHOD = create_fetch_engine(access);

  return { FETCH_METHOD };
}
