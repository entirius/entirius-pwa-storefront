# The theme contract

What a theme can replace, what each part receives from the core, and what stays the core's. The types are in
`@entirius/storefront-sdk`; the list of files with one line each is `pnpm overrides --all` in a theme.

## How a file replaces another

The core imports every part of the look as `@theme/<path>` (`@theme/product/gallery`). That path resolves to your
theme's `src/<path>` when the file exists, else to the default theme's. Inside the default theme the parts import
each other the same way, so replacing one reaches everywhere it is used: a theme's `ui/button` is the button of the
default quantity stepper too.

A replacing file keeps the path and the exports of the default one (`pnpm check` names a missing export). It may
import the SDK, other theme files (`@theme/...`), React, Next, and the default theme's libraries: `lucide-react`,
`radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `embla-carousel-react`.

## The SDK

| Import | What it gives |
|---|---|
| `@entirius/storefront-sdk/i18n` | The messages' types (`Translate`, `MessageKey`); `/i18n/client`: `useI18n()` in browser parts, with `t()`, `price()` and the page's `language`; `/i18n/price-lines`: a product's price as the lines it shows ("From", the struck price). Every interface text goes through `t()`, every price through `price()`. |
| `/storefront` | `Storefront` hooks the core lends every page: `useWishlist`, `useProductCard`, `useQuickAdd`, `useOmnibus` (the lowest 30-day price), `useMenuBranch`, `useHeaderSearch`, `useAccount`, `useCartCount`, `useWishlistSheet`, `useMoveToCart`, `useNotices`, `useLocaleSwitch`. |
| `/components/*` | `Media` (a backend picture through `next/image`, a placeholder when it fails), `RichText` (sanitized HTML from the backend), `Link` (a shop path with the country's prefix), `TokenLinks` (a sentence with `{privacy}`-style links). |
| `/layout`, `/layout/context` | The layout's data (`useLayout()`): the shop's name and logo, menu types, languages and currencies, the footer's columns, the published legal pages (`legal`). |
| `/product`, `/product/card` | Product shapes (`Price`, `ProductMedia`, `ProductCardData`...) and the props of the similar products. |
| `/product/page` | The product page's model, `useProductPage()`. |
| `/catalog/listing` | The listing's model (a category or search), `useListingPage()`, and the filter panel's hooks. |
| `/cart`, `/cart/page` | The order parts' shapes (steps, unit price, totals, gifts, the cart's problems) and the cart page's model, `useCartPage()`. |
| `/checkout` | Checkout's summary, the receipt and the page after the order. |
| `/account`, `/account/page` | The account pages' models (`useAccountMenu`, `useAccountOverview`, `useOrdersPage`, `useOrderPage`, `useAddressesPage`) and the shapes of orders and addresses. |
| `/cms` | The props of every CMS block (`CmsLink`, `CmsPictures`, `CmsWidth`...). |
| `/blog` | The blog's view models and its pages' props. |
| `/forms` | The models of the forms' views (`ValidatedForm`, consent forms, the discount code). |
| `/mocks` | Sample data of every model and `MockShell` (the providers): what `pnpm check` renders with, for a theme's own tests too. |

## Three kinds of parts

| Kind | Where | Gets its data | Rule |
|---|---|---|---|
| Browser part | product page, listing, cart, account, the header and its panels | a hook of its page's model, `Storefront` hooks | `"use client"` at the top, words through `useI18n()` |
| Server part | CMS blocks, blog, page shell, 404 page, similar products | props, `t` among them | no `"use client"`: `t` cannot reach the browser; a browser part may sit inside |
| View of the core's logic | forms, checkout's summary, the page after the order, the account's message pages | a model in props | draw what the model says; validating, sending, saving are the core's |

## Pages and their parts

| Where | Template (arranges the parts) | Data | Stays in the core |
|---|---|---|---|
| Every page | `layout/page-shell`: `header`, `footer` and their parts, notices, the wishlist and account sheets | `useLayout()`, `Storefront` hooks; the layout slots rendered by the core | the session, the cart's sync, the cookie banner's logic (its look: `cookie-consent.css`) |
| Product page | `product/product-page`: `gallery`, `header`, `price`, `stock-status`, `variant-picker`, `buy-box`, `description`, `specs`, `stories`, `related`, `sticky-buy-bar` | `useProductPage()` | stock, buy rules, the forms' logic (their views: `forms/*`), the similar products' choice (their section: `product/related-products`) |
| Category, search | `catalog/listing-page`: `listing-header`, `filters`, `sort-options`, `filter-range`, `filter-options`, `filters-sheet`, `pagination`, `product-grid`, `listing-empty` | `useListingPage()`, filter hooks | the query, filters in the address, pages |
| Cart | `cart/cart-page`: `cart-line`, `cart-summary`, `cart-bar`, `gift-line`, `gift-picker`; `order/*` shared with checkout | `useCartPage()` | the cart's sync, stock caps, gift rules, the discount code's logic |
| Checkout | `order/page-header`, `order/order-steps`, `checkout/checkout-summary`, `checkout/success-page` | props | **the steps, forms, saved addresses, delivery with the pickup map, payment, the order button, their order and validation: not overridable** |
| Account | `account/account-layout`, `overview-page`, `orders-page`, `order-page`, `addresses-page`, `reset-password-page`; `components/message-page` | account hooks; props | the guard, the session, the forms' logic |
| CMS pages | `cms/cms-page`, a part per block type: `cms/section-text`, `cms/tile-hero`... | props | the blocks' data (products, posts, button addresses) |
| Blog | `blog/blog-page`, `post-page`, `author-page` and their parts | props | posts, dates and authors in the page language, search engine data |
| 404 | `layout/not-found-page`, `not-found-search` | props, `useHeaderSearch()` | |
| Everywhere | `components/*` (product card, price, badges, breadcrumbs), `ui/*` (buttons, fields, sheets: shadcn/ui), `tokens.css` | | |

Everything about data, addresses, search engines (titles, structured data, the sitemap) and security is the core's
and the same whatever the theme.

## Theme variables

`tokens.css` (and a shop's `_CONFIG/theme.css` after it) sets these on `:root`; the core's components read them, so
one value changes every place it is used. Colours take any CSS colour; a `-foreground` is the text on its pair.

| Variables | What they shape |
|---|---|
| `--background`, `--foreground`, `--heading` | The page, its text, headings |
| `--primary`, `--primary-foreground` | Buttons, links, the active state; `--ring` the focus ring, `--highlight` highlights |
| `--secondary`, `--muted`, `--accent` (each with `-foreground`) | Quiet buttons, muted text and areas, the light tint of active items |
| `--card`, `--popover` (with `-foreground`) | Cards, menus and sheets |
| `--border`, `--input`, `--field-border` | Lines, a field's hovered and resting border |
| `--destructive`, `--positive`, `--notice`, `--informative` (each with `-surface`) | Errors, savings and success, warnings, information: the text colour and its light background |
| `--link`, `--leading`, `--glass-hover` | Text links, the CMS editor's colour variants, the hover of light buttons |
| `--radius`, `--control-radius`, `--chip-radius` | Corners: the cookie banner, every control of one height (buttons, fields, stepper; `0` square, `9999px` pills), round icon buttons and chips |
| `--surface-bg`, `--surface-radius`, `--surface-padding`, `--surface-padding-lg`, `--surface-padding-sm`, `--surface-divider`, `--surface-outline-padding` | Section containers; a flat theme sets the background to `transparent`, radius and paddings to `0` |
| `--surface-backdrop`, `--surface-fade`, `--surface-glow`, `--surface-card` | The category header's gradient (`none` turns it off), fades and shadows |
| `--product-image-ratio` | Every product photo, width / height (`1 / 1`, `3 / 4`) |
| `--catalog-columns` | Product columns of the listing on wide screens |
| `--page-max-width` | The page's width |
| `--spacing-touch`, `--swatch-cross` | The smallest touch target; the stroke over an unavailable colour swatch |

The dark colour set sits under `html.dark` (a shop's `COLOR_SCHEME: "dark"`): a theme sets it there.

## Attributes the core relies on

Keep these when you replace the part that carries them:

| Attribute | On | Used by |
|---|---|---|
| `data-rich-text` | `RichText` (SDK) | the text styles of backend HTML |
| `data-article` | the blog post (`blog/post-page`) | reading width and spacing of the post's text |
| `data-order-receipt`, `data-print-hide` | the receipt and the buttons of `checkout/success-page` | printing the receipt |
| `data-product-tile`, `data-stock` | the product card | the `unavailable:` variant (a sold-out card's look) |
| `data-layout-slot` | the slots in `layout/page-shell` | a shop's `theme.css` rules for the announcement bar |
| `data-cms-type`, `data-cms-variant` | a wrapper the core puts around every CMS block | a shop's `theme.css` rules per block type |
