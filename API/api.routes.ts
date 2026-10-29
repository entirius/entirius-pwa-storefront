// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

export const API_CATEGORIES_ROUTE = "/api/matrix/v2/__CHANNEL__/categories/";
// Option axes + variant list of a configurable product: `suffix: [url_key, "variants"]` (see variants_query).
export const API_PRODUCTS_ROUTE = "/api/matrix/v2/__CHANNEL__/products/";
export const API_PRICES_ROUTE = "/api/matrix/v2/__CHANNEL__/prices/";
export const API_CATALOG_FILTERS_ROUTE = "/api/matrix/v2/__CHANNEL__/options/";
export const API_STOCK_ROUTE = "/api/matrix/v2/__CHANNEL__/stock/";
export const API_SEARCH_ROUTE = "/api/matrix/v2/__CHANNEL__/search/";
// Lowest price in the 30 days before a reduction (EU Omnibus), batch: ?sku=A&sku=B.
export const API_OMNIBUS_ROUTE = "/api/matrix/v2/__CHANNEL__/omnibus/";
export const API_CART_ROUTE = "/api/checkout/v2/__CHANNEL__/carts/__CART_ID__/";
// The logged-in customer's most recent open cart (404 when there is none).
export const API_CART_LATEST_ROUTE = "/api/checkout/v2/__CHANNEL__/carts/latest/";
export const API_CART_ITEMS_ROUTE =
  "/api/checkout/v2/__CHANNEL__/carts/__CART_ID__/items/";
// PATCH { codes: [{ code }] } replaces the manual codes; { clear: true } drops them.
export const API_CART_DISCOUNTS_ROUTE =
  "/api/checkout/v2/__CHANNEL__/carts/__CART_ID__/discounts/";
export const API_CART_ADDRESS_ROUTE =
  "/api/checkout/v2/__CHANNEL__/carts/__CART_ID__/addresses/";
// LIST endpoints (GET) — currently 500 on the backend (guest path crashes).
export const API_CART_SHIPPING_ROUTE =
  "/api/checkout/v2/__CHANNEL__/carts/__CART_ID__/shipping-methods/";
export const API_CART_PAYMENT_ROUTE =
  "/api/checkout/v2/__CHANNEL__/carts/__CART_ID__/payment-methods/";
// SELECT endpoints (PATCH) — work as guest; wired for the future shipping/payment steps.
export const API_CART_SHIPPING_SELECT_ROUTE =
  "/api/checkout/v2/__CHANNEL__/carts/__CART_ID__/shipping/";
export const API_CART_PAYMENT_SELECT_ROUTE =
  "/api/checkout/v2/__CHANNEL__/carts/__CART_ID__/payment/";
// POST places an order; GET a single order: this route with `suffix: [pretty_id]`.
// Countries the channel accepts (public with the checkout key): [{ code, label, prefix }] + default_country.
export const API_CHECKOUT_COUNTRIES_ROUTE = "/api/checkout/v2/__CHANNEL__/countries/";
export const API_CART_ORDERS_ROUTE = "/api/checkout/v2/__CHANNEL__/orders/";
// v2 list — the customer's own orders (401 without a token), summary rows,
// paginated with `page` / `page_size`.
export const API_CART_ORDERS_LIST_ROUTE =
  "/api/checkout/v2/__CHANNEL__/orders/list/";
// ----- AUTHENTICATION -----
export const API_USER_LOGIN_ROUTE =
  "/api/accounts/v1/__CHANNEL__/customer/tokens/";
// POST signs up; POST with `suffix: [uid]` and `?key=` activates the account from the mail.
export const API_USER_SIGNUP_ROUTE =
  "/api/accounts/v1/__CHANNEL__/customer/signup/";
export const API_USER_PROFILE_ROUTE =
  "/api/accounts/v1/__CHANNEL__/customer/__USER_ID__/profile/";
export const API_USER_PROFILE_UPDATE_ROUTE =
  "/api/accounts/v1/__CHANNEL__/customer/__USER_ID__/profile/";
export const API_USER_ADDRESSES_ROUTE =
  "/api/accounts/v1/__CHANNEL__/customer/__USER_ID__/addresses/";
export const API_USER_ADDRESSES_DEFAULTS_ROUTE =
  "/api/accounts/v1/__CHANNEL__/customer/__USER_ID__/addresses/defaults/";
// POST { email } mails a link to the backend's RESET_PASSWORD_REDIRECT_URL (`/reset-password?key=`);
// POST with `suffix: [key]` sets the new password. No token for either.
export const API_USER_PASSWORD_RESET_ROUTE =
  "/api/accounts/v1/__CHANNEL__/customer/password/reset/";
export const API_USER_PASSWORD_CHANGE_ROUTE =
  "/api/accounts/v1/__CHANNEL__/customer/password/change/";
// The signed-in customer's wishlist (accounts keeps SKUs only): GET { uid, products: [{ sku, name }] }, 400 while
// the customer has none yet. POST / DELETE { sku: [...] } on the product route add / remove.
export const API_WISHLIST_ROUTE = "/api/accounts/v1/__CHANNEL__/wishlist/";
export const API_WISHLIST_PRODUCT_ROUTE = "/api/accounts/v1/__CHANNEL__/wishlist/product/";
// ----- AUTHENTICATION -----
// ----- CMS / CONTENT -----
export const API_CMS_STATIC_PAGE_ROUTE =
  "/api/contentdb/v1/published/static-page/";
export const API_CMS_ROUTES_ROUTE = "/api/contentdb/v1/routes/";
// Published layout extender of type `footer` — link columns edited in the CMS
// navigation editor.
export const API_CMS_FOOTER_ROUTE =
  "/api/contentdb/v1/layout-extender-published/footer/";
// Published blog posts. `routes=<slug>` gives the post in every language it is written in; with `language` as well
// the one answer also carries its older / newer neighbours (`prev` / `next`).
export const API_CMS_BLOG_POST_ROUTE = "/api/contentdb/v1/published/blog-post/";
// Blog categories with published posts (`language` is matched case-sensitively: upper-case ISO code).
export const API_CMS_BLOG_CATEGORIES_ROUTE = "/api/contentdb/v1/category/";
// One author: `suffix: [slug]`. 404 for an author without published posts.
export const API_CMS_BLOG_AUTHORS_ROUTE = "/api/contentdb/v1/authors/";
// ----- CMS / CONTENT -----
// ----- CONTACT FORMS (django_contact_forms; X-API-KEY of the channel, optional) -----
// Form types the channel defines: { results: [{ code, label, is_default }] }.
export const API_CONTACT_FORM_TYPES_ROUTE = "/api/contact-forms/v2/__CHANNEL__/form-types/";
// POST a submission as one form type: `suffix: [type_code]`.
export const API_CONTACT_SUBMIT_ROUTE = "/api/contact-forms/v2/__CHANNEL__/submit/";
// ----- COOKIE CONSENT (django-agreements >= 2.2.0) -----
export const API_COOKIE_BANNER_ROUTE =
  "/api/agreements/v2/__CHANNEL__/cookie-banner/";
export const API_COOKIE_CONSENTS_ROUTE =
  "/api/agreements/v2/__CHANNEL__/cookie-consents/";
// ----- COOKIE CONSENT -----


// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// API Routes Policy
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------

// Server fetches of `shared_cache` routes go through the Next data cache, keyed on the full URL (channel in the
// path, language in the query) and the headers. Only public catalogue and content GETs belong there: menu, footer,
// layout slots and CMS pages, asked on every SSR. 60 s: a CMS publish shows within a minute, and under load the
// layout costs one backend call per minute instead of five per page view. Never a cart, customer, checkout or
// stock route; fetch_builder also skips any request that carries credentials.
export const SHARED_CACHE_SECONDS = 60;

export const API_ROUTES_POLICY = {
  [API_CATEGORIES_ROUTE]: { default_querys: ["language"], shared_cache: true },
  [API_PRODUCTS_ROUTE]: { default_querys: ["language", "currency", "country"] },
  [API_SEARCH_ROUTE]: { default_querys: ["language", "currency", "country"] },
  [API_USER_PROFILE_ROUTE]: {
    refresh_on: [401],
    optional_refresh: true,
    default_headers: [
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_WISHLIST_ROUTE]: {
    refresh_on: [401],
    optional_refresh: true,
    default_headers: [
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_WISHLIST_PRODUCT_ROUTE]: {
    refresh_on: [401],
    optional_refresh: true,
    default_headers: [
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  // Address book (accounts service — Authorization only, no x-api-key). GET (map
  // id→address), PUT create, PATCH ?id (full body), DELETE ?id; defaults GET/POST.
  [API_USER_ADDRESSES_ROUTE]: {
    refresh_on: [401],
    optional_refresh: true,
    default_headers: [
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_USER_ADDRESSES_DEFAULTS_ROUTE]: {
    refresh_on: [401],
    optional_refresh: true,
    default_headers: [
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_PRICES_ROUTE]: { default_querys: ["currency", "country"] },
  [API_COOKIE_BANNER_ROUTE]: { default_querys: ["language"] },
  [API_COOKIE_CONSENTS_ROUTE]: {
    default_headers: [{ "Content-Type": "application/json" }],
  },
  [API_OMNIBUS_ROUTE]: { default_querys: ["currency", "country"] },
  [API_CATALOG_FILTERS_ROUTE]: { default_querys: ["language"] },
  // Real-time stock (Auth Optional — auth headers intentionally skipped for now).
  [API_STOCK_ROUTE]: { default_querys: ["language"] },
  [API_CART_ROUTE]: {
    // if you want to add a query, you can add it here
    // f.e.
    // default_querys: ['language', 'country'],
    // passed as array of strings
    // values are matched to access.get_language() and access.get_country()
    default_querys: ["language"],
    refresh_on: [401],
    optional_refresh: true,
    // if you want to add a header, you can add it here
    // f.e.
    // default_headers: [
    //   ['x-api-key', 'channel_checkout_key'],
    //   { 'Content-Type': 'application/json' },
    // ],
    // passed as array of tuples or objects
    // tuples will be resolved to access.get_channel_checkout_key()
    // objects will be passed as-is
    default_headers: [
      ["x-api-key", "channel_checkout_key"],
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_CART_LATEST_ROUTE]: {
    default_querys: ["language"],
    refresh_on: [401],
    default_headers: [
      ["x-api-key", "channel_checkout_key"],
      ["Authorization", "access_token"],
    ],
  },
  [API_CART_ITEMS_ROUTE]: {
    // v2 update path: PATCH /carts/{cart_id}/items/ (full-replace of the item set).
    default_querys: ["language"],
    refresh_on: [401],
    optional_refresh: true,
    default_headers: [
      ["x-api-key", "channel_checkout_key"],
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_CART_DISCOUNTS_ROUTE]: {
    default_querys: ["language"],
    refresh_on: [401],
    optional_refresh: true,
    default_headers: [
      ["x-api-key", "channel_checkout_key"],
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_CART_ADDRESS_ROUTE]: {
    // v2 checkout: PATCH /carts/{cart_id}/addresses/ { shipping_address, billing_address }.
    default_querys: ["language"],
    refresh_on: [401],
    optional_refresh: true,
    default_headers: [
      ["x-api-key", "channel_checkout_key"],
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_CART_SHIPPING_SELECT_ROUTE]: {
    // PATCH /carts/{cart_id}/shipping/ { code } — select a shipping method.
    // default_querys: ["language"],
    // refresh_on: [401],
    // optional_refresh: true,
    default_headers: [
      ["x-api-key", "channel_checkout_key"],
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_CART_PAYMENT_SELECT_ROUTE]: {
    // PATCH /carts/{cart_id}/payment/ { code, bank_id, card, save_card } — select payment.
    default_querys: ["language"],
    refresh_on: [401],
    optional_refresh: true,
    default_headers: [
      ["x-api-key", "channel_checkout_key"],
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_CART_SHIPPING_ROUTE]: {
    default_querys: ["language"],
    refresh_on: [401],
    optional_refresh: true,
    default_headers: [
      ["x-api-key", "channel_checkout_key"],
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_CART_PAYMENT_ROUTE]: {
    default_querys: ["language"],
    refresh_on: [401],
    optional_refresh: true,
    default_headers: [
      ["x-api-key", "channel_checkout_key"],
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_CHECKOUT_COUNTRIES_ROUTE]: {
    default_querys: ["language"],
    default_headers: [["x-api-key", "channel_checkout_key"]],
  },
  [API_CART_ORDERS_ROUTE]: {
    // for GET orders language gives 500 error...
    // comented for now at least...
    //  default_querys: ['language'],
    refresh_on: [401],
    optional_refresh: true,
    default_headers: [
      ["x-api-key", "channel_checkout_key"],
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_CART_ORDERS_LIST_ROUTE]: {
    refresh_on: [401],
    optional_refresh: true,
    default_headers: [
      ["x-api-key", "channel_checkout_key"],
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_USER_SIGNUP_ROUTE]: {
    default_headers: [{ "Content-Type": "application/json" }],
  },
  [API_USER_LOGIN_ROUTE]: {
    default_querys: ["language"],
    default_headers: [{ "Content-Type": "application/json" }],
  },
  [API_USER_PASSWORD_RESET_ROUTE]: {
    default_headers: [{ "Content-Type": "application/json" }],
  },
  [API_USER_PASSWORD_CHANGE_ROUTE]: {
    refresh_on: [401],
    default_headers: [
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_CONTACT_FORM_TYPES_ROUTE]: {
    default_headers: [["X-API-KEY", "contact_forms_key"]],
  },
  [API_CONTACT_SUBMIT_ROUTE]: {
    default_headers: [["X-API-KEY", "contact_forms_key"], { "Content-Type": "application/json" }],
  },
  [API_CMS_STATIC_PAGE_ROUTE]: { shared_cache: true },
  [API_CMS_ROUTES_ROUTE]: { shared_cache: true },
  [API_CMS_FOOTER_ROUTE]: { shared_cache: true },
  // A post assigned to other channels is not this shop's (a post without channels is everyone's).
  [API_CMS_BLOG_POST_ROUTE]: { default_querys: ["channel"], shared_cache: true },
  [API_CMS_BLOG_CATEGORIES_ROUTE]: { shared_cache: true },
  // The author's post count is the channel's.
  [API_CMS_BLOG_AUTHORS_ROUTE]: { default_querys: ["channel"], shared_cache: true },
};
