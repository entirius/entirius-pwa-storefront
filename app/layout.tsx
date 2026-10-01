import type { Metadata } from "next";
import { Inter, Lexend_Deca } from "next/font/google";
import "./globals.css";

import { cookies } from "next/headers";

import { TanstackQueryProvider } from "@/providers/Tanstack-query.provider";
import { AuthProvider } from "@/providers/auth.provider";
import { HeaderComponent } from "./_components/layout/header-component";
import { Suspense } from "react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/config";
import { BRAND } from "@/_CONFIG/app.config.json";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: `Shop at ${SITE_NAME}.`,
  // Identity assets live in _CONFIG/brand/ (see app/brand/[file]/route.ts).
  icons: BRAND.FAVICON ? { icon: `/brand/${BRAND.FAVICON}` } : undefined,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Dark only — the Entirius brand has no light theme. The class keeps shadcn's
    // dark: variants on for good.
    <html lang="en" className="dark">
      <body
        className={`${lexendDeca.variable} ${inter.variable} antialiased`}
      >
        <TanstackQueryProvider>
          {/* AuthGate reads the cookie inside Suspense so the dynamic read
              doesn't block the static shell (Next 16 blocking-route rule). */}
          <Suspense fallback={<div>Loading...</div>}>
            <AuthGate>{children}</AuthGate>
          </Suspense>
        </TanstackQueryProvider>
      </body>
    </html>
  );
}

// Seeds the client AuthProvider from the readable `at` cookie (SSR-correct, no
// hydration flash), and wraps both the header and the page so both share context.
async function AuthGate({ children }: { children: React.ReactNode }) {
  const isLoggedIn = Boolean((await cookies()).get("at")?.value);
  return (
    <AuthProvider initial={isLoggedIn}>
      <HeaderComponent />
      <main className="p-4">{children}</main>
    </AuthProvider>
  );
}
