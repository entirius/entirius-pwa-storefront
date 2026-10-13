// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import type { Metadata, Viewport } from "next";
import { Inter, Lexend_Deca } from "next/font/google";
import "./globals.css";
import "@/_CONFIG/theme.css";

import { cookies } from "next/headers";

import { TanstackQueryProvider } from "@/providers/Tanstack-query.provider";
import { AuthProvider } from "@/providers/auth.provider";
import { I18nProvider } from "@/providers/i18n.provider";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { HeaderComponent } from "./_components/layout/header-component";
import { LayoutSlot } from "./_components/layout-slots/layout-slot";
import { ScrollToTop } from "./_components/scroll-to-top.client";
import { CookieConsent } from "./_components/cookie-consent/cookie-consent.client";
import { FooterComponent } from "./_components/layout/footer-component";
import { Suspense } from "react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/config";
import { THEME } from "@/_CONFIG/app.config.json";
import { DEFAULT_OG_IMAGES, MANIFEST_PATH, THEME_COLOR, brand_url, has_manifest } from "@/lib/brand";
// Brand typefaces (styleguide §1). Both are variable fonts: one file each, no
// weight list. Lexend Deca carries headings and the wordmark (300/400 only, never
// bold); Inter carries the shop UI. Fallback metrics come from the brand tokens.
const lexendDeca = Lexend_Deca({
  variable: "--font-lexend-deca",
  subsets: ["latin", "latin-ext"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

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
  const { language, messages, t } = await get_i18n();
  return (
    // Light by default; an instance sets THEME: "dark" in _CONFIG/app.config.json
    // for the brand's dark set (app/globals.css), which also turns shadcn's dark:
    // variants on.
    <html lang={language} className={THEME === "dark" ? "dark" : undefined}>
      <body
        className={`${lexendDeca.variable} ${inter.variable} antialiased`}
      >
        <I18nProvider language={language} messages={messages}>
          <TanstackQueryProvider>
            {/* AuthGate reads the cookie inside Suspense so the dynamic read
                doesn't block the static shell (Next 16 blocking-route rule). */}
            <Suspense fallback={<div>{t("layout.loading")}</div>}>
              <AuthGate>{children}</AuthGate>
            </Suspense>
          </TanstackQueryProvider>
        </I18nProvider>
        <ScrollToTop />
        <CookieConsent />
      </body>
    </html>
  );
}

// Seeds the client AuthProvider from the readable `at` cookie (SSR-correct, no
// hydration flash), and wraps the header, the page and the layout slots so all share context.
async function AuthGate({ children }: { children: React.ReactNode }) {
  const isLoggedIn = Boolean((await cookies()).get("at")?.value);
  return (
    <AuthProvider initial={isLoggedIn}>
      <LayoutSlot name="announcement" />
      <HeaderComponent />
      <main className="mx-auto w-full max-w-7xl p-4">{children}</main>
      <LayoutSlot name="before-footer" />
      <FooterComponent />
    </AuthProvider>
  );
}
