import type { NextRequest } from "next/server";
import { _LOGGER } from "@/lib/logger";

import countries from "@/_CONFIG/countries.config.json";

const READ_COOKIES_NAMES: [string, string | null][] = [
  // language
  ["lg", "default_language"],
  // currency
  ["cr", "default_currency"],
  // theme
  ["th", "light"],
  // channel
  ["ch", "default_channel"],
  // access token
  ["at", null],
  // refresh token
  ["rt", null],
  // user id
  ["uid", null],
  // cart id
  ["cid", null],
];
const READ_CF_HEADERS_NAMES = ["cf-ipcountry"];
const COUNTRIES_APP_SETTINGS = countries as any;

export default function geo_CF_helper(
  request: NextRequest,
  CH_HEADER: string = "cf-ipcountry", // Cloudflare IP Country Header
) {
  // ------------------------------------------------------------
  // Read headers from request
  // ------------------------------------------------------------
  const _headers: Record<string, string | null> = {};

  for (const _name of READ_CF_HEADERS_NAMES) {
    const _value = request.headers.get(_name as string) ?? null;
    _headers[_name as string] = _value;
  }
  // ------------------------------------------------------------

  // ------------------------------------------------------------
  // Read cookies from request
  // ------------------------------------------------------------
  // Check if country is set in cookies
  // if true -> set from cookies
  // if false -> check from headers
  // if still false -> set to default
  // ------------------------------------------------------------
  const _cookies: Record<string, string | null> = {};

  // ------------------------------------------------------------

  const _COUNTRY =
    request.cookies.get("ct")?.value ?? _headers["cf-ipcountry"] ?? "default";

  _cookies["ct"] = _COUNTRY;
  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // ------------------------------------------------------------
  _LOGGER({ type: "info", message: "setted COUNTRY", print: _COUNTRY });
  for (const [_name, _default_value_codename] of READ_COOKIES_NAMES) {
    let _value: string | null =
      request.cookies.get(_name as string)?.value ?? null;
    // _LOGGER({
    //   type: "info",
    //   message: "Cookie",
    //   print: {
    //     _name,
    //     _default_value_codename,
    //     _value,
    //   },
    // });
    if (!_value && _default_value_codename) {
      _value = COUNTRIES_APP_SETTINGS[_COUNTRY]
        ? COUNTRIES_APP_SETTINGS[_COUNTRY][_default_value_codename]
        : COUNTRIES_APP_SETTINGS["default"][_default_value_codename];
    }
    _cookies[_name as string] = _value;
  }
  // ------------------------------------------------------------
  // ------------------------------------------------------------

  // if (!cf_country) {
  //   data.data = "default";
  //   data.set_cookie = "default";
  //   data.cookie_name = COOKIE_NAME;
  //   return data;
  // }

  // data.data = cf_country;
  // data.set_cookie = cf_country;
  // data.cookie_name = COOKIE_NAME;
  return _cookies;
}
