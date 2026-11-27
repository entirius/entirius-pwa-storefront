// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { MessageKey, Params } from "../i18n/translate";
import type { Price, ProductMedia } from "../product/types";

// The shell around every page: header, footer, menus, search, account, wishlist, notices.

export type MenuType = "hamburger" | "megamenu";

export type MenuCategory = {
  id?: string | number;
  url_key: string;
  name: string;
  has_children: boolean;
  // Only in a branch response: the row's subtree.
  children?: MenuCategory[];
  // The parent itself as the first row of its branch ("View all <name>").
  is_self?: boolean;
};

export type FooterLink = { label: string; href: string; external: boolean };
export type FooterColumn = { heading: string; links: FooterLink[] };

// The languages and currencies the visitor's country offers, and the active ones.
export type LocaleChoice = {
  languages: string[];
  currencies: string[];
  language: string;
  currency: string;
  // language -> the currency that goes with it (choosing the language also chooses it)
  pairs: Record<string, string>;
};

// What the core works out on the server for the layout of one request.
export type LayoutData = {
  site: { name: string; logo: string | null; logo_alt: string };
  menu: {
    mobile: MenuType;
    desktop: MenuType;
    // The desktop megamenu is short enough to share the top row with the logo (from 1280 px).
    one_row: boolean;
  };
  // null: one language and one currency, nothing to switch.
  locale: LocaleChoice | null;
  footer: FooterColumn[];
  // The published legal pages of the active language (terms, privacy policy), for the footer's bottom bar.
  legal: FooterLink[];
};

export type Crumb = { name: string; href?: string };

export type NoticeTone = "positive" | "destructive" | "notice" | "informative";
export type NoticeInput = {
  message: MessageKey;
  params?: Params;
  title?: MessageKey;
  tone?: NoticeTone;
  // How long it stays, while neither the pointer nor the focus is on it.
  timeout?: number;
  // One button or link next to the message (View wishlist, View cart); the notice closes when it is used.
  action?: { label: MessageKey; run: () => void } | { label: MessageKey; href: string };
};
export type Notice = NoticeInput & { id: number; tone: NoticeTone; timeout: number };

export type SearchProduct = {
  sku: string;
  name: string;
  // The product page, or its parent's with the variant chosen for a variant hit.
  href: string;
  on_stock?: boolean;
  price: Price | null;
  media: ProductMedia;
};
export type SearchCategory = { idx?: string; name?: string; url_key?: string; products_count?: number };
export type SearchResults = {
  phrases?: { text: string; type: string }[];
  categories?: { results?: SearchCategory[] };
  products?: { total?: number; results?: SearchProduct[] };
};

// The header search: the typed text, its debounced value and what the API answers for it.
export type HeaderSearch = {
  open: boolean;
  q: string;
  setQ: (q: string) => void;
  // The text the results belong to.
  debounced: string;
  // Long enough to search (min_chars).
  enabled: boolean;
  min_chars: number;
  data: SearchResults | undefined;
  isFetching: boolean;
  isError: boolean;
  onOpenChange: (open: boolean) => void;
  // Enter: the results page of the typed phrase.
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export type LoginFormProps = {
  notice: string | null;
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
};
export type RegisterFormProps = { onSwitchToLogin: () => void; onRegistered: () => void };
export type ForgotPasswordFormProps = { onBack: () => void; onSent: () => void };
