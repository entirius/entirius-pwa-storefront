import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/_CONFIG/theme.css";
import { brand } from "@/_CONFIG/brand.config";

import { cookies } from "next/headers";

import { TanstackQueryProvider } from "@/providers/Tanstack-query.provider";
import { AuthProvider } from "@/providers/auth.provider";
import { I18nProvider } from "@/providers/i18n.provider";
import { get_i18n } from "@/lib/i18n/i18n.server";
import { HeaderComponent } from "./_components/layout/header-component";
import { Suspense } from "react";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: brand.name,
  description: brand.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // <html lang> follows the language cookie, which is runtime data: Next 16 (cacheComponents)
  // requires it behind a Suspense boundary.
  return (
    <Suspense>
      <LocalizedDocument>{children}</LocalizedDocument>
    </Suspense>
  );
}

async function LocalizedDocument({ children }: { children: React.ReactNode }) {
  const { language, messages } = await get_i18n();
  return (
    <html lang={language}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider language={language} messages={messages}>
          <TanstackQueryProvider>
            <AuthGate>{children}</AuthGate>
          </TanstackQueryProvider>
        </I18nProvider>
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
