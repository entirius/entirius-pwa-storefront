type TOKENS = { access_token: string; refresh_token: string };

// register routes to catch refresh_on
type ROUTE_POLICY = {
  refresh_on?: number[]; // statuses that should trigger refresh+retry
  optional_refresh?: boolean;
  default_querys?: string[];
  default_headers?: ([string, string] | Record<string, string | null>)[];
};

type API_ACCESS = {
  get_language?: () => string | null;
  get_currency?: () => string | null;
  get_country?: () => string | null;
  get_channel?: () => string | null;
  get_access_token?: () => string | null;
  get_refresh_token?: () => string | null;
  get_user_id?: () => string | null;
  get_cart_id?: () => string | null;
  get_channel_checkout_key?: () => string | null;
  set_tokens?: (tokens: TOKENS) => void | Promise<void>;
  clear_tokens?: () => void | Promise<void>;
};

type API_ERROR = { message: string; status?: number; body?: any };
type API_META = { status: number; headers: Headers };

interface COOKIE_ACCESS {
  get(name: string): string | null;
  set?(name: string, value: string): void;    // opcjonalne
  delete?(name: string): void;     
}

type API_REQUEST_INIT = RequestInit & {
  querys?: any;
  headers?: Record<string, string | null>;
};

export {
  API_REQUEST_INIT,
  COOKIE_ACCESS,
  API_ERROR,
  API_META,
  ROUTE_POLICY,
  TOKENS,
  API_ACCESS,
};
