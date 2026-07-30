// context/Api/API.config.ts
import { API_BASE_URL } from "@/_CONFIG/app.config.json";
import { _LOGGER } from "@/lib/logger";
import {
  ROUTE_POLICY,
  API_ERROR,
  API_ACCESS,
  API_META,
  API_REQUEST_INIT,
} from "./api.d";
import { API_ROUTES_POLICY } from "./api.routes";

let access: API_ACCESS;
export function configure_auth(a: API_ACCESS) {
  access = a;
}

// Session-scoped abort. Shared across every create_api instance so a single
// logout can cancel all in-flight requests AND the token refresh — otherwise a
// request that 401s mid-logout refreshes and re-writes the just-cleared tokens.
// abort_session() installs a fresh controller so post-logout guest requests work.
let session_controller = new AbortController();
export function abort_session() {
  session_controller.abort();
  session_controller = new AbortController();
}

// ------------------------------------------------------------
// ------------------------------------------------------------

// 2) Template → regex (CHANNEL = one path segment)
function template_to_regex(pattern: string): RegExp {
  const esc = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const seg = esc.replace(/__\w+__/g, "[^/]+"); // match any placeholder like __FOO__ as one segment
  return new RegExp("^" + seg + "(?:$|[/?#])");
}
// longest-prefix match (covers /user_address/12)
function pick_policy(path: string): ROUTE_POLICY | undefined {
  let best: { key: string; policy: ROUTE_POLICY } | undefined;
  for (const [key, policy] of Object.entries(API_ROUTES_POLICY)) {
    if (template_to_regex(key).test(path)) {
      if (!best || key.length > best.key.length)
        best = { key, policy: policy as ROUTE_POLICY };
    }
  }
  return best?.policy;
}

// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
export function create_fetch_engine(access: API_ACCESS) {
  if (!access) {
    throw new Error("access is not defined");
  }
  let refreshing_promise: Promise<void> | null = null;

  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // ------------------------------------------------------------

  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // ------------------------------------------------------------

  // map special placeholders to resolvers.
  // you can extend this map (e.g., '__USER_ID__': () => access.get_user_id?.())
  const special_param_resolvers: Record<
    string,
    () => Promise<string | undefined> | string | undefined
  > = {
    __CHANNEL__: () => access.get_channel?.() as any,
    __USER_ID__: () => access.get_user_id?.() as any,
    __CHANNEL_CHECKOUT_KEY__: () => access.get_channel_checkout_key?.() as any,
    __CART_ID__: () => access.get_cart_id?.() as any,
  };

  // ------------------------------------------------------------
  // ------------------------------------------------------------
  async function resolver_special_params_if_needed(
    path: string,
  ): Promise<string> {
    const placeholders = path.match(/__\w+__/g) || [];
    let out = path;

    for (const ph of placeholders) {
      const resolver = special_param_resolvers[ph];

      // 1) explicit resolver
      let val: any = resolver ? await resolver() : undefined;

      // 2) implicit fallback: __FOO__ → try get_foo() or access.foo
      // if (val == null) {
      //   const key = ph.slice(2, -2).toLowerCase(); // "__CHANNEL__" => "channel"
      //   const getter_name = `get_${key}`;
      //   const getter = (access as any)?.[getter_name];
      //   val = typeof getter === 'function' ? await getter() : (access as any)?.[key];
      // }

      if (val === undefined) throw new Error(`missing-route-param:${ph}`);
      if (val === null) val = "";
      out = out.replace(new RegExp(ph, "g"), String(val));
      // delete doubled slashes that could appear in the path because of last params could be empty
      out = out.replace(/([^:])\/\//g, "$1/");
    }

    return out;
  }

  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // helper function to convert params to query string
  async function to_query_string(...inputs: any[]): Promise<string> {
    let querys: any = [];

    const [default_querys, init_querys] = inputs;

    // init querys should be an object
    // they could override default querys so be careful
    if (init_querys && typeof init_querys === "object") {
      for (const [key, value] of Object.entries(init_querys)) {
        // Skip null/undefined and empty string values
        if (value == null || value === "") {
          continue;
        }

        // Skip empty plain objects
        if (
          typeof value === "object" &&
          !Array.isArray(value) &&
          value !== null
        ) {
          if (Object.keys(value).length === 0) {
            continue;
          }
        }

        // Arrays map to repeated query params: ?key=a&key=b
        if (Array.isArray(value)) {
          // Remove empty elements within arrays
          const compacted = value.filter(
            (v) =>
              !(
                v == null ||
                v === "" ||
                (typeof v === "object" &&
                  v !== null &&
                  Object.keys(v).length === 0)
              ),
          );
          if (compacted.length === 0) {
            continue;
          }
          for (const v of compacted) {
            const normalized =
              typeof v === "object" && v !== null ? JSON.stringify(v) : v;
            querys.push([key, normalized]);
          }
          continue;
        }

        // Plain objects are JSON-encoded into a single param value
        if (typeof value === "object" && value !== null) {
          querys.push([key, JSON.stringify(value)]);
          continue;
        }

        // Primitives go as-is
        querys.push([key, value]);
      }
    }
    // default querys sould be simple from access
    // like language, country, currency, channel
    // single key value pair
    if (default_querys && Array.isArray(default_querys)) {
      for (const query of default_querys) {
        // if querys already has this query, skip
        if (querys.find(([k]: any) => k === query)) continue;
        // ------------------------------------------------------------
        // ------------------------------------------------------------
        const getter = (access as any)[`get_${query}`];

        if (typeof getter !== "function") {
          _LOGGER({
            message: "Cannot find getter for query => ",
            type: "error",
            print: { query, getter, access },
          });
          continue;
        }
        const access_query = await getter();
        querys.push([query, access_query]);
      }
    }

    // if no querys, return empty string
    if (!querys.length) return "";
    // ------------------------------------------------------------
    // ------------------------------------------------------------
    // other querys should be converted to query string
    // ------------------------------------------------------------
    // ------------------------------------------------------------

    const querys_string = new URLSearchParams(querys).toString();

    return `${querys_string ? `?${querys_string}` : ""}`;
  }

  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // helper function to build headers from:
  // - route default_headers (tuples + objects)
  // - init.headers (overrides defaults)
  // - extra headers (e.g. Authorization)
  async function to_headers(
    default_headers: ROUTE_POLICY["default_headers"],
    init_headers: API_REQUEST_INIT["headers"],
    extra_headers: Record<string, string>,
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    // 1) from route default_headers
    if (default_headers && Array.isArray(default_headers)) {
      for (const item of default_headers as any[]) {
        // Tuple: [header_key, access_key]
        if (Array.isArray(item) && item.length === 2) {
          const [header_key, access_key] = item as [string, string];
          const getter = (access as any)[`get_${access_key}`];

          if (typeof getter !== "function") {
            _LOGGER({
              message: "Cannot find getter for header => ",
              type: "error",
              print: { header_key, access_key, access },
            });
            continue;
          }

          const value = await getter();
          // if value is null/undefined, skip this header
          if (value == null) continue;

          headers[header_key] = String(value);
          continue;
        }

        // Object: complete header map, used as-is (no access lookup)
        if (item && typeof item === "object") {
          for (const [key, value] of Object.entries(
            item as Record<string, string | null>,
          )) {
            if (value == null) continue;
            headers[key] = String(value);
          }
        }
      }
    }

    // 2) init.headers overrides defaults
    if (init_headers && typeof init_headers === "object") {
      for (const [key, value] of Object.entries(init_headers)) {
        // if null/undefined, remove/skip header
        if (value == null) {
          delete headers[key];
          continue;
        }
        headers[key] = String(value);
      }
    }

    // 3) extra headers (e.g. Authorization) override everything
    for (const [key, value] of Object.entries(extra_headers || {})) {
      if (value == null) continue;
      headers[key] = String(value);
    }

    return headers;
  }

  async function _REFRESH_TOKEN() {
    if (!refreshing_promise) {
      _LOGGER({
        message: "REFRESHING TOKEN ++++++++ ",
        type: "warning",
      });
      refreshing_promise = (async () => {
        const rt = access.get_refresh_token?.();
        const channel = access.get_channel?.();
        if (!rt) {
          _LOGGER({
            message: "NO REFRESH TOKEN (clearing tokens) => ",
            type: "info",
            print: rt,
          });
          access.clear_tokens?.();
          throw new Error("no-refresh-token");
        }

        if (!channel) {
          _LOGGER({
            message: "CANNOT FIND CHANNEL (clearing tokens) => ",
            type: "info",
            print: channel,
          });
          access.clear_tokens?.();
          throw new Error("no-channel");
        }

        _LOGGER({
          message: "REFRESH ATTEMPT => ",
          type: "info",
          print: { channel, rt },
        });
        // ------------------------------------------------------------
        const URL = `/api/accounts/v1/${channel}/customer/tokens/refresh/`;
        const body: RequestInit = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: rt }),
        };
        // ------------------------------------------------------------
        _LOGGER({
          message: "REFRESH PAYLOAD => ",
          type: "info",
          print: { body, URL },
        });

        // ------------------------------------------------------------
        const res = await fetch(`${API_BASE_URL}${URL}`, {
          ...(body as RequestInit),
          signal: session_controller.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          _LOGGER({
            message: "REFRESH FAILED => ",
            type: "error",
            print: err,
          });
          throw Object.assign(new Error("refresh-failed"), {
            status: res.status,
            body: err,
          });
        }
        // ------------------------------------------------------------
        // ------------------------------------------------------------
        const { data } = await res.json();
        // ------------------------------------------------------------
        // ------------------------------------------------------------
        const { access: res_acc_token, refresh: res_ref_token } = data;
        access.set_tokens?.({
          access_token: res_acc_token,
          refresh_token: res_ref_token,
        });
        // ------------------------------------------------------------
        // ------------------------------------------------------------

        _LOGGER({
          message: "REFRESH SUCCESSFUL => ",
          type: "success",
          print: { data },
        });
      })().finally(() => (refreshing_promise = null));
    }
    return refreshing_promise;
  }

  async function fetch_builder(path: string, init: API_REQUEST_INIT = {}) {
    const policy = pick_policy(path);
    path = await resolver_special_params_if_needed(path);

    const querys = await to_query_string(
      policy?.default_querys || [],
      init.querys,
    );


    // if refresh_on is true, get the access token
    const at = policy?.refresh_on ? access.get_access_token?.() : null;

    if (!at && policy?.refresh_on && !policy?.optional_refresh) {
      _LOGGER({
        message: "NO ACCESS TOKEN PROVIDED",
        type: "warning",
      });
      throw new Error("no-access-token");
    }
    const headers = await to_headers(
      policy?.default_headers || [],
      init.headers || {},
      policy?.refresh_on && at ? { Authorization: `Bearer ${at}` } : {},
    );
    // ------------------------------------------------------------
    _LOGGER({
      message: "FULL REQUEST => ",
      type: "info",
      print: {
        path: `${API_BASE_URL}${path}${querys}`,
        ...init,
        headers,
        querys, policy,
      },
    });

    // const base = typeof window === "undefined" ? API_BASE_URL : "";
    return fetch(`${API_BASE_URL}${path}${querys ? `${querys}` : ""}`, {
      ...init,
      headers,
      signal: session_controller.signal,
    });
  }

  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // describe the function
  // @param path: string
  // @param init?: API_REQUEST_INIT
  // @returns [API_ERROR | undefined, T | undefined, API_META | undefined]  it will handle the refresh token if needed
  // additionally it will handle the query string if needed
  // pass querys in init.querys

  // f.e.
  // const [error, response, meta] = await FETCH_METHOD('/api/matrix/v2/__CHANNEL__/categories/', { querys: { language: "PL" } })
  // if you want to pass multiple languages, you can pass an array in querys
  // const [error, response, meta] = await FETCH_METHOD('/api/matrix/v2/__CHANNEL__/categories/', { querys: { language: ['PL', 'EN'] } })

  // special PARAMS (like __CHANNEL__) will be resolved by the function
  // so you can pass __CHANNEL__ in path

  // set it in policy
  // if refresh_on is true, it will handle the refresh token if needed

  return async function FETCH_METHOD<T>(
    path: string,
    init?: API_REQUEST_INIT,
  ): Promise<[API_ERROR | undefined, T | undefined, API_META | undefined]> {
    const policy = pick_policy(path);
    const do_req = () => fetch_builder(path, init);


    // Catch build-time errors like: missing-route-param, no-access-token, etc.
    let res: Response | undefined;
    try {
      res = await do_req();
    } catch (e: any) {
      const err: API_ERROR = { message: e?.message || "request-build-failed" };
      _LOGGER({
        message: "REQUEST BUILD FAILED => ",
        type: "warning",
        print: err,
      });
      return [err, undefined, undefined];
    }
    // for refresh token if needed, we will try to refresh the token
    if (!res.ok && policy?.refresh_on?.includes(res.status)) {
      try {
        await _REFRESH_TOKEN();
        res = await do_req();
      } catch (error: any) {
        _LOGGER({
          message: "Everything failed => ",
          type: "error",
          print: error,
        });

        access.clear_tokens?.();
        const err: API_ERROR = {
          message: error?.message || "refresh-failed",
          status: error?.status ?? "app error (?)",
        };
        return [err, undefined, undefined];
      }
    }

    const meta: API_META | undefined = res
      ? { status: res.status, headers: res.headers }
      : undefined;

    if (!res.ok) {
      let body: any;
      try {
        body = await res.json();
      } catch {}
      const err: API_ERROR = {
        message: body?.message || `HTTP ${res.status}`,
        status: res.status ?? "app error (?)",
        body,
      };
      _LOGGER({ message: "REQUEST ERROR => ", type: "error", print: err });
      return [err, undefined, meta];
    }

    const data = (await res.json()) as T;

    _LOGGER({
      message: "REQUEST SUCCESSFUL => ",
      type: "success",
      print: data,
    });

    return [undefined, data, meta];
  };
}
