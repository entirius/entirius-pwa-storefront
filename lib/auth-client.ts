import { create_api } from "@/API/api.context";
import { abort_session } from "@/API/api.setup";
import { make_client_access } from "@/API/access/api.client-access";
import {
  API_USER_LOGIN_ROUTE,
  API_USER_SIGNUP_ROUTE,
  API_USER_PROFILE_ROUTE,
} from "@/API/api.routes";
import {
  login_schema,
  register_schema,
  type LoginFormValues,
  type RegisterFormValues,
} from "@/utils/validation/auth.schema";

// Client-side auth. Tokens (`at`/`rt`/`uid`) live in readable cookies so the
// client engine can attach `Authorization` on cart/checkout/profile and refresh
// on 401 — the whole data layer already runs client-side via make_client_access.
// (Login used to be a Server Action, but mutating cookies there forced a full
// RSC refetch of the current route; doing it client-side avoids that.)

type LoginResponse = {
  data: { access: string; refresh: string; customer_id: string };
};

export type LoginResult =
  | { ok: true }
  | { ok: false; error: "invalid_credentials" | "unknown" };

export async function client_login(
  input: LoginFormValues,
): Promise<LoginResult> {
  // Defense in depth — the form validates too, but never trust it.
  const parsed = login_schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_credentials" };

  const access = make_client_access();
  const api = create_api(access);
  const [error, data] = await api.FETCH_METHOD<LoginResponse>(
    API_USER_LOGIN_ROUTE,
    { method: "POST", body: JSON.stringify(parsed.data) },
  );

  // Bad credentials come back as 403 (status "no_active_account"); 400/401 are
  // guarded too. Anything else (5xx, network, malformed success) → unknown.
  if (error || !data?.data?.access) {
    const status = error?.status;
    const bad_credentials =
      status === 400 || status === 401 || status === 403;
    return { ok: false, error: bad_credentials ? "invalid_credentials" : "unknown" };
  }

  const { access: at, refresh, customer_id } = data.data;
  // Readable cookies (path=/, Secure, SameSite=Lax, 30d) — see make_client_access.
  access.set?.("at", at);
  access.set?.("rt", refresh);
  access.set?.("uid", String(customer_id));

  return { ok: true };
}

// The matrix backend wraps every response in { meta: { status, message }, data }.
type ApiEnvelope = {
  meta?: { status?: string; message?: string };
  data?: unknown;
  error?: unknown;
};

export type RegisterResult =
  | { ok: true }
  | { ok: false; field: "email" | "password" | "root"; message: string };

const REGISTER_GENERIC = "Could not create the account. Please try again.";

function map_signup_error(
  status: number | undefined,
  meta: ApiEnvelope["meta"],
): RegisterResult {
  const code = meta?.status ?? "";
  const message = meta?.message;
  // Server faults (e.g. a backend "Internal Exception") must never reach the user.
  if (status === 500 || code === "ERR" || !message) {
    return { ok: false, field: "root", message: REGISTER_GENERIC };
  }
  // Route the backend's (already human-readable) message to the right field.
  const field: "email" | "password" | "root" = /email/i.test(code)
    ? "email"
    : /password|capital|symbol|number/i.test(code)
      ? "password"
      : "root";
  return { ok: false, field, message };
}

export async function client_register(
  input: RegisterFormValues,
): Promise<RegisterResult> {
  const parsed = register_schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, field: "root", message: "Please check the form and try again." };
  }

  const access = make_client_access();
  const language = access.get("lg") ?? "en";
  const api = create_api(access);

  const { email, password, consent_terms, consent_data } = parsed.data;
  const [error, data] = await api.FETCH_METHOD<ApiEnvelope>(API_USER_SIGNUP_ROUTE, {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      // Accounts agreements contract: email = data/marketing consent,
      // condition = terms+privacy acceptance, newsletter always false.
      agreements: { email: consent_data, condition: consent_terms, newsletter: false },
      language,
    }),
  });

  // Signup returns no tokens — success means the account was created (the user
  // confirms via email, then logs in). Soft errors can ride a 2xx via data.error.
  if (error || data?.error) {
    const meta = (error?.body as ApiEnvelope | undefined)?.meta ?? data?.meta;
    return map_signup_error(error?.status, meta);
  }

  return { ok: true };
}

export type ActivateResult = { ok: true } | { ok: false; message: string };

const ACTIVATE_GENERIC =
  "Something went wrong verifying your account. Please try again.";

// Completes the double-opt-in: after signup the backend emails a link
// (/user-handler?key=&uid=) and the account stays inactive until this fires.
// Activation contract: POST the signup resource for that customer id —
// `uid` in the path, `key` in the query, no body, no auth.
// We inline `uid` from the URL rather than the __USER_ID__ placeholder, which
// resolves from the (not-yet-set) `uid` cookie. Returns no tokens; login is next.
export async function client_activate(
  uid: string,
  key: string,
): Promise<ActivateResult> {
  if (!uid || !key) return { ok: false, message: ACTIVATE_GENERIC };

  const access = make_client_access();
  const api = create_api(access);
  const [error] = await api.FETCH_METHOD(`${API_USER_SIGNUP_ROUTE}${uid}/`, {
    method: "POST",
    querys: { key },
  });

  if (error) return { ok: false, message: ACTIVATE_GENERIC };
  return { ok: true };
}

export function client_logout(): void {
  // Cancel any in-flight request + token refresh first, so a request that 401s
  // mid-logout can't refresh and re-write the tokens we're about to clear.
  abort_session();
  const access = make_client_access();
  access.delete?.("at");
  access.delete?.("rt");
  access.delete?.("uid");
}

export type Profile = { firstname: string; lastname: string; email: string };

export type ProfileResult = { ok: true; profile: Profile } | { ok: false };

export async function client_get_profile(): Promise<ProfileResult> {
  const access = make_client_access();
  if (!access.get("uid")) return { ok: false };

  const api = create_api(access);
  // The profile route resolves __USER_ID__ from the `uid` cookie and (now that
  // `at` is readable) attaches the Bearer header from policy.
  const [error, data] = await api.FETCH_METHOD<{ data: Profile }>(
    API_USER_PROFILE_ROUTE,
    { method: "GET" },
  );

  if (error || !data?.data?.email) return { ok: false };
  const { firstname, lastname, email } = data.data;
  return { ok: true, profile: { firstname, lastname, email } };
}

// PATCH the profile (keys are `firstname`/`lastname`). Same route/policy as the
// GET — Bearer attaches automatically. NOTE: the backend currently accepts
// this (200 "profile successfully updated") but does not persist it; the value
// won't stick until the backend is fixed. We re-read to reflect the server truth.
export async function client_update_profile(input: {
  firstname: string;
  lastname: string;
}): Promise<ProfileResult> {
  const access = make_client_access();
  if (!access.get("uid")) return { ok: false };

  const api = create_api(access);
  const [error] = await api.FETCH_METHOD(API_USER_PROFILE_ROUTE, {
    method: "PATCH",
    body: JSON.stringify({
      firstname: input.firstname,
      lastname: input.lastname,
    }),
  });
  if (error) return { ok: false };

  return client_get_profile();
}
