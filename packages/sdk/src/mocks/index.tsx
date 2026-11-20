// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

"use client";

import { createRef, type ReactNode } from "react";
import { useForm, type DefaultValues, type FieldValues } from "react-hook-form";
import { I18nProvider } from "../i18n/client";
import { create_i18n } from "../i18n/translate";
import { en } from "../i18n/messages/en";
import { StorefrontProvider, type Storefront } from "../storefront";
import { LayoutProvider } from "../layout/context";
import type { LayoutData } from "../layout/types";
import type { ProductCardData } from "../product/card";
import type { ProductPageModel } from "../product/page";
import type { ListingHooks, ListingPageModel } from "../catalog/listing";
import type { CartPageModel } from "../cart/page";
import type { CartAlertsModel, OrderTotalsModel } from "../cart/types";
import type {
  AccountMenuModel,
  AccountOverviewModel,
  AddressesPageModel,
  OrderPageModel,
  OrdersPageModel,
} from "../account/page";
import type { AddressLinesModel, OrderModel, OrderSummaryModel } from "../account/types";
import type { CheckoutSuccessModel, CheckoutSummaryModel } from "../checkout/types";
import type { BlogAuthorProfileModel, BlogPostCardModel, BlogPostModel } from "../blog/types";
import type { CmsLink, CmsPicture, CmsPictures } from "../cms/types";
import type { ConsentModel, ValidatedForm } from "../forms/types";

// Sample data in the shapes of the SDK's models, for rendering a theme's parts without a shop (`entirius check`) and
// for a theme's own tests. Every action does nothing; the texts are English.

const noop = () => {};
const resolve_nothing = () => Promise.resolve(() => null);

export const mock_i18n = create_i18n("en", en);
export const mock_t = mock_i18n.t;

const media = [[{ uri: "/placeholder.svg", width: 600, height: 600 }]];

export const mock_product: ProductCardData = {
  sku: "MOCK-1",
  name: "Mock chair",
  url_key: "mock-chair",
  price: { gross: "129.00", currency: "EUR", final_gross: "99.00" },
  media,
  on_stock: true,
  description: "A chair for checking a theme.",
  product_type: "SIMPLE",
  badges: [{ idx: "new", name: "New" }],
  percent_off: 23,
};

const wishlist_item = { ...mock_product, price: mock_product.price, description: "", media };

export const mock_storefront: Storefront = {
  media_src: (src) => src || "/placeholder.svg",
  image_placeholder: "/placeholder.svg",
  useLocalHref: (href) => href,
  useWishlist: () => ({ mounted: true, active: false, toggle: noop }),
  useProductCard: (product) => ({
    sold_out: product.on_stock === false,
    image: product.media[0]?.[0]?.uri ?? "/placeholder.svg",
    single_piece: "",
    quick_add: product.price ? { sku: product.sku, name: product.name, url_key: product.url_key, price: product.price, media: product.media } : null,
    wishlist_item: { ...wishlist_item, sku: product.sku, name: product.name, url_key: product.url_key },
  }),
  useQuickAdd: () => ({ state: "idle", run: noop }),
  useOmnibus: () => ({ gross: "109.00", currency: "EUR" }),
  useMenuBranch: () => ({
    categories: [
      { url_key: "chairs", name: "Chairs", has_children: true },
      { url_key: "sofas", name: "Sofas", has_children: false },
    ],
    loading: false,
    error: null,
  }),
  usePrefetchMenuBranch: () => noop,
  useHeaderSearch: () => ({
    open: false,
    q: "",
    setQ: noop,
    debounced: "",
    enabled: false,
    min_chars: 2,
    data: undefined,
    isFetching: false,
    isError: false,
    onOpenChange: noop,
    onSubmit: (event) => event.preventDefault(),
  }),
  useAccount: () => ({ logged_in: false, signed_in: noop }),
  useCartCount: () => 2,
  useWishlistSheet: () => ({ open: false, set_open: noop, count: 1, items: [wishlist_item], movable: () => true }),
  useMoveToCart: () => ({ state: "idle", run: noop }),
  useNotices: () => ({ notices: [], dismiss: noop }),
  useLocaleSwitch: () => ({ pending: false, change_language: noop, change_currency: noop }),
  forms: {
    login: resolve_nothing,
    register: resolve_nothing,
    forgot_password: resolve_nothing,
    Newsletter: () => null,
  },
};

export const mock_layout: LayoutData = {
  site: { name: "Mock shop", logo: null, logo_alt: "Mock shop" },
  menu: { mobile: "hamburger", desktop: "megamenu", one_row: false },
  locale: { languages: ["en", "pl"], currencies: ["EUR", "PLN"], language: "en", currency: "EUR", pairs: { en: "EUR", pl: "PLN" } },
  footer: [{ heading: "Help", links: [{ label: "Contact", href: "/contact", external: false }] }],
};

// The providers every browser part reads: the messages, the core's hooks, the layout.
export function MockShell({ children }: { children: ReactNode }) {
  return (
    <I18nProvider language="en" messages={en}>
      <StorefrontProvider value={mock_storefront}>
        <LayoutProvider value={mock_layout}>{children}</LayoutProvider>
      </StorefrontProvider>
    </I18nProvider>
  );
}

export const mock_product_page: ProductPageModel = {
  product: {
    sku: mock_product.sku,
    name: mock_product.name,
    url_key: mock_product.url_key,
    brands: ["Mock"],
    badges: mock_product.badges ?? null,
    percent_off: 23,
    key_facts: "Oak · 80 cm",
    description_html: "<p>A chair for checking a theme.</p>",
    specs: [{ name: "Size", rows: [{ idx: "width", name: "Width", value: "80 cm", parts: [{ label: "80 cm", value_idx: null }] }] }],
    stories: [{ idx: "care", name: "Care", html: "<p>Wipe with a damp cloth.</p>" }],
  },
  media,
  price: { value: mock_product.price, from: false, omnibus_sku: mock_product.sku },
  purchasable: true,
  stock: { known: true, in_stock: true, show_status: true, sold_out: false, sold: true },
  variants: {
    axes: [
      {
        idx: "color",
        label: "Colour",
        swatch: true,
        options: [
          { value: "red", label: "Red", color_hash: null },
          { value: "oak", label: "Oak", color_hash: null },
        ],
      },
    ],
    selection: { color: "red" },
    choose: noop,
    is_available: () => true,
    sold_out_selectable: false,
  },
  buy: {
    mode: "buy",
    can_buy: true,
    label: "Add to cart",
    single_piece: false,
    quantity: 1,
    set_quantity: noop,
    max: 5,
    add_to_cart: noop,
  },
  wishlist_item,
  notify_similar: { visible: false, open: noop },
  spec_link: () => null,
  blocks: { enquiry: null, stock_alert: null, notify_similar: null },
  related: null,
  buy_area: createRef<HTMLDivElement>(),
  scroll_to_buy_area: noop,
};

export const mock_listing_page: ListingPageModel = {
  kind: "category",
  header: {
    title: "Chairs",
    trail: [{ name: "Chairs" }],
    description_html: "<p>Chairs for every room.</p>",
    description_long: false,
    subcategories: [{ name: "Armchairs", href: "/catalog/armchairs" }],
  },
  hint: null,
  status: "ready",
  error: null,
  products: [mock_product, { ...mock_product, sku: "MOCK-2", url_key: "mock-sofa", name: "Mock sofa", on_stock: false }],
  filtered: false,
  pagination: { page: 1, has_prev: false, has_next: true, go: noop, pending: false },
  list_ref: createRef<HTMLDivElement>(),
  blocks: { notify_similar: null },
};

export const mock_listing_hooks: ListingHooks = {
  useFilters: () => ({
    status: "ready",
    updating: false,
    sort: [{ idx: "price", label: "Price" }],
    ranges: [{ idx: "price", label: "Price", min: 10, max: 900 }],
    filters: [{ idx: "color", label: "Colour", options: [{ idx: "red", label: "Red", count: 3 }] }],
    applied: false,
    chosen: 0,
    apply: noop,
    clear: noop,
  }),
  useAppliedFilters: () => ({ applied: false, discard_choices: noop }),
  useFilterOption: () => ({ checked: false, toggle: noop }),
  useSortCriterion: () => ({ direction: null, toggle: noop }),
  useRangeFilter: () => ({ value: null, set: noop, clear: noop }),
};

export const mock_totals: OrderTotalsModel = {
  fetching: false,
  subtotal: "€198.00",
  savings: "€30.00",
  gifts: null,
  discount: { label: "Discount (WELCOME)", amount: "€10.00" },
  delivery: { price: "€0.00", free: true },
  delivery_at_checkout: false,
  fee: null,
  free_shipping_away: null,
  total: "€188.00",
  vat: "€35.15",
};

export const mock_alerts: CartAlertsModel = { sync: null, problems: ["Mock sofa: only 1 left."] };

const order_steps: CartPageModel["steps"] = [
  { key: "cart", label: "Cart", state: "current" },
  { key: "address", label: "Address", state: "next" },
];

export const mock_cart_page: CartPageModel = {
  ready: true,
  lines: [
    {
      sku: mock_product.sku,
      name: mock_product.name,
      href: "/product/mock-chair",
      picture: "/placeholder.svg",
      quantity: 2,
      max: 5,
      unit: { regular: "129.00", final: "99.00", percent_off: 23, currency: "EUR" },
      total: "€198.00",
      problem: null,
      set_quantity: noop,
      remove: noop,
    },
  ],
  pieces: 2,
  logged_in: false,
  total: "€188.00",
  steps: order_steps,
  totals: mock_totals,
  alerts: mock_alerts,
  blocks: { gift_lines: null, gift_picker: null, discount_code: null },
};

const address: AddressLinesModel = {
  name: "Anna Tester",
  company: null,
  tax_id: null,
  street: "Main Street 1",
  city: "00-001 Warsaw, PL",
  phone: "+48 500600700",
  email: "anna@example.com",
};

export const mock_order_summary: OrderSummaryModel = {
  id: "1042",
  href: "/profile/orders/1042",
  date: "2 Nov 2026, 10:00",
  items: 2,
  status: { label: "Confirmed", tone: "positive" },
  total: "€188.00",
};

export const mock_order: OrderModel = {
  id: "1042",
  date: "2 Nov 2026, 10:00",
  status: { label: "Confirmed", tone: "positive" },
  lines: [
    {
      name: mock_product.name,
      quantity: 2,
      unit: { price: "€99.00", regular: "€129.00", percent: "23" },
      total: "€198.00",
      sub_items: [{ label: "Oak", quantity: 1 }],
    },
  ],
  shipping_address: address,
  shipping: { name: "Courier", point: null, price: "€0.00", free: true, regular: "€15.00" },
  payments: [{ name: "Card", pay_code: "PAY-1" }],
  billing_address: { ...address, street: "Office Road 5", company: "Acme", tax_id: "PL123" },
  summary: { net: "€152.85", tax: "€35.15", shipping: "€0.00", free_shipping: true, total: "€188.00", saved: "€30.00" },
  comment: "Please call before delivery.",
};

export const mock_account_menu: AccountMenuModel = {
  items: [
    { id: "overview", href: "/profile", label: "Overview", current: true },
    { id: "orders", href: "/profile/orders", label: "My orders", current: false },
    { id: "addresses", href: "/profile/addresses", label: "Delivery addresses", current: false },
  ],
  log_out: noop,
};

export const mock_account_overview: AccountOverviewModel = {
  details: { name: "Anna Tester", email: "anna@example.com", editing: false, edit: noop, form: null },
  latest_order: mock_order_summary,
  address: { lines: address, count: 2 },
  password: { editing: false, changed: true, edit: noop, form: null },
};

export const mock_orders_page: OrdersPageModel = {
  status: "ready",
  orders: [mock_order_summary],
  more: { available: true, loading: false, load: noop },
  probe: null,
};

export const mock_order_page: OrderPageModel = { id: "1042", status: "ready", order: mock_order };

export const mock_addresses_page: AddressesPageModel = {
  status: "ready",
  addresses: [{ id: "a1", lines: address, is_default: true, set_default: noop, edit: noop, remove: noop }],
  add: noop,
  form: null,
};

export const mock_checkout_summary: CheckoutSummaryModel = {
  lines: [
    {
      sku: mock_product.sku,
      name: mock_product.name,
      picture: "/placeholder.svg",
      quantity: 2,
      unit: { regular: "129.00", final: "99.00", percent_off: 23, currency: "EUR" },
      total: "€198.00",
      problem: "limited",
    },
  ],
  totals: mock_totals,
  blocks: { gift_lines: null, discount_code: null },
};

export const mock_checkout_success: CheckoutSuccessModel = {
  message: "Your order number is 1042.",
  payment_failed: true,
  transfer_note: "Pay by transfer within 7 days.",
  receipt: {
    seller: "Mock shop",
    numbers: "1042",
    date: "2 November 2026 at 10:00",
    amount: "€188.00",
    payment: { name: "Bank transfer", description: { text: "<p>IBAN PL00 0000</p>", html: true }, copy_text: "IBAN PL00 0000" },
    delivery: { name: "Courier", price: { value: "€0.00", free: true }, point: null },
  },
  print: noop,
};

export const mock_picture: CmsPicture = { src: "/placeholder.svg", width: 1200, height: 800, alt: "A mock picture" };
export const mock_pictures: CmsPictures = { desktop: mock_picture, mobile: mock_picture };
export const mock_links: CmsLink[] = [
  { label: "All chairs", href: "/catalog/chairs", external: false, new_tab: false, look: null },
  { label: "Partner", href: "https://example.com", external: true, new_tab: true, look: "outline" },
];

export const mock_post_card: BlogPostCardModel = {
  href: "/blog/mock-post",
  language: "en",
  title: "A mock post",
  excerpt: "What a theme's blog looks like.",
  cover: mock_picture,
  authors: "Anna and Jan",
  published: { iso: "2026-11-02T10:00:00Z", label: "2 November 2026" },
};

export const mock_post: BlogPostModel = {
  language: "en",
  title: "A mock post",
  category: { name: "News", href: "/blog?category_url_key=news" },
  byline: [
    { text: "Anna", href: "/blog/authors/anna" },
    { text: " and ", href: null },
    { text: "Jan", href: null },
  ],
  published: { iso: "2026-11-02T10:00:00Z", label: "2 November 2026" },
  updated: { iso: "2026-11-05T10:00:00Z", label: "5 November 2026" },
  cover: mock_picture,
  toc: [
    { id: "first-section", text: "First" },
    { id: "faq", text: "Questions" },
  ],
  authors: [{ name: "Anna", href: "/blog/authors/anna", role: "Editor", bio: "Writes about chairs.", photo: null }],
  prev: { title: "An older post", href: "/blog/older" },
  next: null,
};

export const mock_author: BlogAuthorProfileModel = {
  name: "Anna",
  href: "/blog/authors/anna",
  role: "Editor",
  bio: "Writes about chairs.",
  photo: null,
  links: [{ url: "https://example.com", label: "example.com" }],
};

export const mock_pagination = {
  prev: null,
  next: "/blog?page=2",
  pages: [{ number: 1, href: "/blog", current: true }, null, { number: 5, href: "/blog?page=5", current: false }],
};

export const mock_consent: ConsentModel = {
  checked: false,
  set: noop,
  text: "I agree to the {privacy}.",
  links: { privacy: { route: "privacy-policy", label: "privacy policy" } },
};

// A react-hook-form form with the given values, for a form's view (inside a component: it is a hook).
export function useMockForm<V extends FieldValues>(values: DefaultValues<V>): ValidatedForm<V> {
  const form = useForm<V>({ defaultValues: values });
  return { form, submit: () => Promise.resolve(), pending: false };
}

// Links without the external one, for parts that print buttons in a row.
export const mock_link_less: CmsLink[] = mock_links.slice(0, 1);
