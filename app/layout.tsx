// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Metadata, Viewport } from "next";
import "./globals.css";
// A theme's colours and shapes, then the shop's own: the later file wins.
import "@theme/tokens.css";
import "@/_CONFIG/theme.css";
import { FONT_CLASSES } from "@/_CONFIG/fonts";

import { cookies } from "next/headers";

import { TanstackQueryProvider } from "@/providers/Tanstack-query.provider";
import { AuthProvider } from "@/providers/auth.provider";
import { I18nProvider } from "@entirius/storefront-sdk/i18n/client";
import { StorefrontRuntime } from "@/lib/storefront/storefront.client";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { PageShell } from "@theme/layout/page-shell";
import { LayoutRuntime } from "@/lib/layout/layout-runtime";
import { WishlistAccountSync } from "@/lib/layout/wishlist-account-sync.client";
import { load_layout_slot } from "./_components/layout-slots/api.query";
import { CmsDocument } from "./[customer_country]/(builder)/[[...slug]]/_components/cms-document";
import { ScrollToTop } from "./_components/scroll-to-top.client";
import { CookieConsent } from "./_components/cookie-consent/cookie-consent.client";
import { Suspense } from "react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/config";
import { COLOR_SCHEME } from "@/_CONFIG/app.config.json";
import { DEFAULT_OG_IMAGES, MANIFEST_PATH, THEME_COLOR, brand_url, has_manifest } from "@/lib/brand";
import { PageLoading } from "@theme/ui/spinner";
import { PrefetchBoundary } from "@/lib/prefetch_boundary";
import { get_server_api } from "@/lib/seo/server-api";
import { agreement_definitions_query } from "@/lib/agreements.query";

const base_metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  // Identity assets live in _CONFIG/brand/ (see app/brand/[file]/route.ts).
  icons: site_icons(),
  manifest: has_manifest() ? MANIFEST_PATH : undefined,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    images: DEFAULT_OG_IMAGES,
  },
  twitter: {
    card: "summary_large_image",
    images: DEFAULT_OG_IMAGES,
  },
};

// Optional BRAND files: whatever is not configured is simply left out.
function site_icons(): Metadata["icons"] {
  const apple = brand_url("ICON_192");
  const icon = brand_url("FAVICON") ?? apple;
  if (!icon) return undefined;
  return { icon, ...(apple && { apple }) };
}

export const viewport: Viewport = {
  ...(THEME_COLOR && { themeColor: THEME_COLOR }),
};

// The description follows the active language.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await get_i18n();
  return { ...base_metadata, description: t("layout.description", { name: SITE_NAME }) };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // <html lang> and the messages follow the language cookie (lib/i18n/i18n.server.ts).
  const { language, messages } = await get_i18n();
  return (
    // Light by default; an instance sets COLOR_SCHEME: "dark" in _CONFIG/app.config.json
    // for the brand's dark set (app/globals.css), which also turns shadcn's dark:
    // variants on.
    <html lang={language} className={COLOR_SCHEME === "dark" ? "dark" : undefined}>
      <body className={`${FONT_CLASSES} antialiased`}>
        <I18nProvider language={language} messages={messages}>
          <StorefrontRuntime>
            <TanstackQueryProvider>
              {/* AuthGate reads the cookie inside Suspense so the dynamic read
                  doesn't block the static shell (Next 16 blocking-route rule). */}
              <Suspense fallback={<PageLoading />}>
                <AuthGate>{children}</AuthGate>
              </Suspense>
            </TanstackQueryProvider>
          </StorefrontRuntime>
        </I18nProvider>
        <ScrollToTop />
        <CookieConsent />
      </body>
    </html>
  );
}

// Seeds the client AuthProvider from the readable `at` cookie (SSR-correct, no
// hydration flash), and wraps the theme's page shell (header, the page, the layout slots, footer) so all share context.
// The agreement definitions are prefetched here (shared cache): their routes are the legal links of the forms on
// every page, and the review step shows them, so the client asks for them only when the prefetch failed.
async function AuthGate({ children }: { children: React.ReactNode }) {
  const isLoggedIn = Boolean((await cookies()).get("at")?.value);
  const { language } = await get_i18n();
  const api = await get_server_api();
  // The CMS pages of the layout slots (one cached request); without a page a slot renders nothing.
  const [announcement, before_footer] = await Promise.all([
    load_layout_slot("announcement", language),
    load_layout_slot("before-footer", language),
  ]);
  return (
    <AuthProvider initial={isLoggedIn}>
      <PrefetchBoundary prefetches={[agreement_definitions_query(api, language)]}>
        <LayoutRuntime>
          <WishlistAccountSync />
          <PageShell
            announcement={announcement && <CmsDocument content={announcement.content} />}
            before_footer={before_footer && <CmsDocument content={before_footer.content} />}
          >
            {children}
          </PageShell>
        </LayoutRuntime>
      </PrefetchBoundary>
    </AuthProvider>
  );
}
