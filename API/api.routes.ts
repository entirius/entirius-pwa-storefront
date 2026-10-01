export const API_CATEGORIES_ROUTE = "/api/matrix/v2/__CHANNEL__/categories/";
export const API_PRODUCTS_ROUTE = "/api/matrix/v2/__CHANNEL__/products/";
export const API_PRICES_ROUTE = "/api/matrix/v2/__CHANNEL__/prices/";
export const API_CATALOG_FILTERS_ROUTE = "/api/matrix/v2/__CHANNEL__/options/";
export const API_STOCK_ROUTE = "/api/matrix/v2/__CHANNEL__/stock/";
export const API_SEARCH_ROUTE = "/api/matrix/v2/__CHANNEL__/search/";
export const API_CART_ROUTE = "/api/checkout/v2/__CHANNEL__/carts/__CART_ID__/";
export const API_CART_ITEMS_ROUTE =
  "/api/checkout/v2/__CHANNEL__/carts/__CART_ID__/items/";
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
// POST places an order; GET a single order is this route + `{pretty_id}/`.
export const API_CART_ORDERS_ROUTE = "/api/checkout/v2/__CHANNEL__/orders/";
// v2 list. Responds 200 now, but it is NOT usable for "my orders": the rows are a
// slim summary (total_gross/currency/item_count, no cart items, no addresses) and
// it is not customer-scoped — it returns every order in the channel. Kept for the
// DEBUG probe only; the orders list reads v1 below.
export const API_CART_ORDERS_LIST_ROUTE =
  "/api/checkout/v2/__CHANNEL__/orders/list/";
// v1 orders GET — customer-scoped and returns whole orders, so this is what the
// orders list uses. Ignores ordering/page/page_size.
export const API_CART_ORDERS_V1_ROUTE = "/api/checkout/v1/__CHANNEL__/orders/";
// ----- AUTHENTICATION -----
export const API_USER_LOGIN_ROUTE =
  "/api/accounts/v1/__CHANNEL__/customer/tokens/";
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
// ----- AUTHENTICATION -----
// ----- CMS / CONTENT -----
export const API_CMS_STATIC_PAGE_ROUTE =
  "/api/contentdb/v1/published/static-page/";
// ----- CMS / CONTENT -----


// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// API Routes Policy
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------

export const API_ROUTES_POLICY = {
  [API_CATEGORIES_ROUTE]: { default_querys: ["language"] },
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
  // Policy-only key for the single-order detail `.../orders/{id}/`. Not a route
  // constant: the id is concatenated onto API_CART_ORDERS_ROUTE at the call site,
  // and this entry exists so that path still resolves to the checkout auth headers.
  // (pick_policy anchors patterns with `(?:$|[/?#])`, so API_CART_ORDERS_ROUTE does
  // NOT match a longer path — without this the request goes out unauthenticated.)
  // NB: this key is longer than API_CART_ORDERS_LIST_ROUTE's and its `[^/]+` also
  // matches `/orders/list/`, so longest-match hands the list route this policy too.
  // The two are deliberately identical, so that is inert.
  "/api/checkout/v2/__CHANNEL__/orders/__ORDER_ID__/": {
    refresh_on: [401],
    optional_refresh: true,
    default_headers: [
      ["x-api-key", "channel_checkout_key"],
      ["Authorization", "access_token"],
      { "Content-Type": "application/json" },
    ],
  },
  [API_CART_ORDERS_V1_ROUTE]: {
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
  [API_CMS_STATIC_PAGE_ROUTE]: {},
};
