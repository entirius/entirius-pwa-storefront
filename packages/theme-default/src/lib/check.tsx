// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { ComponentType, ReactElement } from "react";
import type { DefaultValues } from "react-hook-form";
import type { ValidatedForm } from "@entirius/storefront-sdk/forms";
import { ProductPageProvider } from "@entirius/storefront-sdk/product/page";
import { ListingPageProvider } from "@entirius/storefront-sdk/catalog/listing";
import { CartPageProvider } from "@entirius/storefront-sdk/cart/page";
import {
  AccountMenuProvider,
  AccountOverviewProvider,
  AddressesPageProvider,
  OrderPageProvider,
  OrdersPageProvider,
} from "@entirius/storefront-sdk/account/page";
import {
  MockShell,
  mock_account_menu,
  mock_account_overview,
  mock_addresses_page,
  mock_alerts,
  mock_author,
  mock_cart_page,
  mock_checkout_success,
  mock_checkout_summary,
  mock_consent,
  mock_link_less,
  mock_links,
  mock_listing_hooks,
  mock_listing_page,
  mock_order_page,
  mock_orders_page,
  mock_pagination,
  mock_picture,
  mock_pictures,
  mock_post,
  mock_post_card,
  mock_product,
  mock_product_page,
  mock_t as t,
  mock_totals,
  useMockForm,
} from "@entirius/storefront-sdk/mocks";
import { ProductPage } from "@theme/product/product-page";
import { ListingPage } from "@theme/catalog/listing-page";
import { CartPage } from "@theme/cart/cart-page";
import { PageShell } from "@theme/layout/page-shell";
import { NotFoundPage } from "@theme/layout/not-found-page";
import { PageBreadcrumbs } from "@theme/components/page-breadcrumbs";
import { MessagePage } from "@theme/components/message-page";
import { AccountLayout } from "@theme/account/account-layout";
import { OverviewPage } from "@theme/account/overview-page";
import { OrdersPage } from "@theme/account/orders-page";
import { OrderPage } from "@theme/account/order-page";
import { AddressesPage } from "@theme/account/addresses-page";
import { ResetPasswordPage } from "@theme/account/reset-password-page";
import { CheckoutSummary } from "@theme/checkout/checkout-summary";
import { SuccessPage } from "@theme/checkout/success-page";
import { CartAlerts } from "@theme/order/cart-alerts";
import { OrderTotals } from "@theme/order/order-totals";
import { CmsPage } from "@theme/cms/cms-page";
import { SectionText } from "@theme/cms/section-text";
import { SectionHeroSlider } from "@theme/cms/section-hero-slider";
import { TileHero } from "@theme/cms/tile-hero";
import { SectionImageText } from "@theme/cms/section-image-text";
import { TileImage } from "@theme/cms/tile-image";
import { TileTxtBtn } from "@theme/cms/tile-txt-btn";
import { SectionAccordion } from "@theme/cms/section-accordion";
import { TileAccordion } from "@theme/cms/tile-accordion";
import { SectionIconGrid } from "@theme/cms/section-icon-grid";
import { TileTitleDescImg } from "@theme/cms/tile-title-desc-img";
import { SectionBanner } from "@theme/cms/section-banner";
import { SectionProductSlider } from "@theme/cms/section-product-slider";
import { TileProduct } from "@theme/cms/tile-product";
import { SectionFaq } from "@theme/cms/section-faq";
import { SectionBlog } from "@theme/cms/section-blog";
import { SectionTypeA } from "@theme/cms/section-type-a";
import { TileTypeA } from "@theme/cms/tile-type-a";
import { TileTypeB } from "@theme/cms/tile-type-b";
import { BlogPage } from "@theme/blog/blog-page";
import { PostPage } from "@theme/blog/post-page";
import { AuthorPage } from "@theme/blog/author-page";
import { LoginForm } from "@theme/forms/login-form";
import { RegisterForm } from "@theme/forms/register-form";
import { ForgotPasswordForm } from "@theme/forms/forgot-password-form";
import { ResetPasswordForm } from "@theme/forms/reset-password-form";
import { ProfileForm } from "@theme/forms/profile-form";
import { ChangePasswordForm } from "@theme/forms/change-password-form";
import { AddressForm } from "@theme/forms/address-form";
import { NewsletterForm } from "@theme/forms/newsletter-form";
import { EnquiryForm } from "@theme/forms/enquiry-form";
import { NotifySimilarForm } from "@theme/forms/notify-similar-form";
import { StockAlertForm } from "@theme/forms/stock-alert-form";
import { DiscountCode } from "@theme/forms/discount-code";

// What `entirius check` renders (and the default theme's test): every page template and every part the core draws
// with props, on the SDK's mocks. A part inside a template is checked through it; a theme's override of any of them
// is what renders, as `@theme/*` resolves to the theme first.

const noop = () => {};

type ValuesOf<M> = M extends ValidatedForm<infer V> ? V : never;

// A form's view with a react-hook-form form of the given values (the form is a hook, so it lives in a component).
function FormCheck<M extends { form: unknown; submit: unknown; pending: boolean }>({
  view: View,
  values,
  props,
}: {
  view: ComponentType<M>;
  values: ValuesOf<M>;
  props: Omit<M, "form" | "submit" | "pending">;
}) {
  const form = useMockForm<ValuesOf<M>>(values as DefaultValues<ValuesOf<M>>);
  return <View {...({ ...form, ...props } as M)} />;
}

const tiles = [<TileTxtBtn key="1" t={t} title="A tile" description="<p>Text</p>" links={mock_links} />];

export const CHECKS: { part: string; render: () => ReactElement }[] = [
  {
    part: "layout/page-shell (header, footer)",
    render: () => (
      <PageShell announcement={<p>Announcement</p>} before_footer={<p>Before the footer</p>}>
        <PageBreadcrumbs trail={[{ name: "Chairs", href: "/catalog/chairs" }, { name: "Mock chair" }]} />
      </PageShell>
    ),
  },
  { part: "layout/not-found-page", render: () => <NotFoundPage t={t} categories={[{ name: "Chairs", href: "/catalog/chairs" }]} /> },
  {
    part: "product/product-page",
    render: () => (
      <ProductPageProvider value={mock_product_page}>
        <ProductPage />
      </ProductPageProvider>
    ),
  },
  {
    part: "catalog/listing-page",
    render: () => (
      <ListingPageProvider value={mock_listing_page} hooks={mock_listing_hooks}>
        <ListingPage />
      </ListingPageProvider>
    ),
  },
  {
    part: "cart/cart-page",
    render: () => (
      <CartPageProvider value={mock_cart_page}>
        <CartPage />
      </CartPageProvider>
    ),
  },
  { part: "order/order-totals", render: () => <OrderTotals totals={{ ...mock_totals, delivery: null, delivery_at_checkout: true }} /> },
  { part: "order/cart-alerts", render: () => <CartAlerts alerts={{ ...mock_alerts, sync: "The cart did not sync." }} /> },
  { part: "checkout/checkout-summary", render: () => <CheckoutSummary summary={mock_checkout_summary} /> },
  { part: "checkout/success-page", render: () => <SuccessPage success={mock_checkout_success} /> },
  {
    part: "account/account-layout, overview-page",
    render: () => (
      <AccountMenuProvider value={mock_account_menu}>
        <AccountOverviewProvider value={mock_account_overview}>
          <AccountLayout>
            <OverviewPage />
          </AccountLayout>
        </AccountOverviewProvider>
      </AccountMenuProvider>
    ),
  },
  {
    part: "account/orders-page",
    render: () => (
      <OrdersPageProvider value={mock_orders_page}>
        <OrdersPage />
      </OrdersPageProvider>
    ),
  },
  {
    part: "account/order-page",
    render: () => (
      <OrderPageProvider value={mock_order_page}>
        <OrderPage />
      </OrderPageProvider>
    ),
  },
  {
    part: "account/addresses-page",
    render: () => (
      <AddressesPageProvider value={mock_addresses_page}>
        <AddressesPage />
      </AddressesPageProvider>
    ),
  },
  { part: "account/reset-password-page", render: () => <ResetPasswordPage form={<p>Form</p>} /> },
  {
    part: "components/message-page",
    render: () => <MessagePage pending={false} title="Done" text="It worked." action={{ label: "Back", href: "/" }} />,
  },
  { part: "cms/cms-page, section-text, tile-txt-btn", render: () => <CmsPage name="Home"><SectionText t={t} title="Title" description="<p>Text</p>" width="container">{tiles}</SectionText></CmsPage> },
  {
    part: "cms/section-hero-slider, tile-hero",
    render: () => (
      <SectionHeroSlider t={t} width="full_width">
        <TileHero t={t} title="Hero" description="<p>Text</p>" pictures={mock_pictures} links={mock_links} image_first dye={2} shape="slide" width="full_width" />
      </SectionHeroSlider>
    ),
  },
  {
    part: "cms/section-image-text, tile-image",
    render: () => (
      <SectionImageText t={t} width="container" spaced>
        <TileImage t={t} picture={mock_picture} />
        {tiles}
      </SectionImageText>
    ),
  },
  {
    part: "cms/section-accordion, tile-accordion",
    render: () => (
      <SectionAccordion t={t} title="Questions" description="<p>Text</p>" links={mock_links}>
        <TileAccordion t={t} id="faq" entries={[{ label: "Why?", html: "<p>Because.</p>" }]} />
      </SectionAccordion>
    ),
  },
  {
    part: "cms/section-icon-grid, tile-title-desc-img",
    render: () => (
      <SectionIconGrid t={t} title="Why us">
        <TileTitleDescImg t={t} title="Fast" description="<p>Text</p>" icon={null} />
        <TileTitleDescImg t={t} title="Safe" description="<p>Text</p>" icon={mock_picture} />
      </SectionIconGrid>
    ),
  },
  {
    part: "cms/section-banner",
    render: () => <SectionBanner t={t} width="container" spaced title="Sale" description="<p>Text</p>" pictures={mock_pictures} links={mock_links} image_first={false} />,
  },
  {
    part: "cms/section-product-slider, tile-product",
    render: () => (
      <SectionProductSlider t={t} title="Chairs" links={mock_links} layout="slider">
        <TileProduct t={t} product={mock_product} />
      </SectionProductSlider>
    ),
  },
  { part: "cms/section-faq", render: () => <SectionFaq t={t} title="FAQ" items={[{ question: "Why?", answer: "<p>Because.</p>" }]} anchor="faq" /> },
  { part: "cms/section-blog", render: () => <SectionBlog t={t} title="From the blog" links={mock_links} width="container" posts={[mock_post_card]} /> },
  {
    part: "cms/section-type-a, tile-type-a, tile-type-b",
    render: () => (
      <SectionTypeA t={t} title="Older" subtitle="Content" description="<p>Text</p>" enquiry={null} links={mock_links} dye={2} variant={2}>
        <TileTypeA t={t} title="Tile" links={mock_link_less} dye={2} variant={2} pictures={mock_pictures} />
        <TileTypeB t={t} url_key="gone" product={null} />
      </SectionTypeA>
    ),
  },
  { part: "blog/blog-page", render: () => <BlogPage t={t} intro={null} tabs={[{ name: "All", href: "/blog", current: true }, { name: "News", href: "/blog?category_url_key=news", current: false }]} posts={[mock_post_card]} pagination={mock_pagination} /> },
  { part: "blog/post-page", render: () => <PostPage t={t} post={mock_post} body={<p>Body</p>} /> },
  { part: "blog/author-page", render: () => <AuthorPage t={t} author={mock_author} posts={[]} pagination={null} /> },
  {
    part: "forms/login-form",
    render: () => <FormCheck view={LoginForm} values={{ email: "", password: "" }} props={{ notice: "Check your mail.", dev_tools: null, forgot_password: noop, register: noop }} />,
  },
  {
    part: "forms/register-form",
    render: () => (
      <FormCheck
        view={RegisterForm}
        values={{ email: "", password: "", confirm_password: "", consent_terms: false, consent_data: false, newsletter: false }}
        props={{ newsletter: true, login: noop }}
      />
    ),
  },
  { part: "forms/forgot-password-form", render: () => <FormCheck view={ForgotPasswordForm} values={{ email: "" }} props={{ back: noop }} /> },
  { part: "forms/reset-password-form", render: () => <FormCheck view={ResetPasswordForm} values={{ password: "", confirm_password: "" }} props={{}} /> },
  { part: "forms/profile-form", render: () => <FormCheck view={ProfileForm} values={{ firstname: "Anna", lastname: "Tester" }} props={{ cancel: noop }} /> },
  {
    part: "forms/change-password-form",
    render: () => <FormCheck view={ChangePasswordForm} values={{ old_password: "", password: "", confirm_password: "" }} props={{ cancel: noop }} />,
  },
  {
    part: "forms/address-form",
    render: () => (
      <FormCheck
        view={AddressForm}
        values={{ firstname: "", lastname: "", street: "", city: "", postcode: "", country_code: "PL", dialling_code: "+48", telephone: "", is_company: true, company: "", tax_id: "" }}
        props={{
          open: true,
          set_open: noop,
          title: "Add address",
          countries: [{ value: "PL", label: "Poland" }],
          dialling: [{ value: "+48", label: "+48" }],
          select_country: noop,
          company: true,
          postcode_hint: "00-001",
        }}
      />
    ),
  },
  { part: "forms/newsletter-form", render: () => <NewsletterForm state="invalid" submit={noop} consent={mock_consent} /> },
  {
    part: "forms/enquiry-form",
    render: () => <EnquiryForm state="failed" submit={noop} consent={mock_consent} id="mock" title="Ask about this product" open open_form={noop} trigger={null} />,
  },
  {
    part: "forms/notify-similar-form",
    render: () => <NotifySimilarForm state="idle" submit={noop} consent={mock_consent} title="Notify me" open open_form={noop} trigger_label="Notify me" />,
  },
  {
    part: "forms/stock-alert-form",
    render: () => (
      <StockAlertForm state="in_stock" submit={noop} consent={mock_consent} title_line="Mock chair" email={{ value: "", set: noop }} error="Try again." saved={null} />
    ),
  },
  {
    part: "forms/discount-code",
    render: () => <DiscountCode value="WELCOME" set_value={noop} apply={noop} can_apply pending={false} message="This code does not work." applied={[{ code: "SPRING", remove: noop }]} />,
  },
];

// One check with the providers every browser part reads.
export const render_check = (check: (typeof CHECKS)[number]) => <MockShell>{check.render()}</MockShell>;
