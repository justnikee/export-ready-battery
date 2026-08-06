import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";

import "./globals.css";
import "flag-icons/css/flag-icons.min.css";

import { Inter, Source_Code_Pro } from "next/font/google";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code",
  display: "swap",
});

import { Providers } from "@/components/providers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: "Anviora - Digital Battery Passport",
  description: "Manage and track battery passports",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  // S-15: per-request nonce from proxy.ts — required for Razorpay without
  // script-src 'unsafe-inline'. Reading headers() also opts this layout into
  // dynamic rendering so Next can attach nonces to framework scripts.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sourceCodePro.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        {/* Nonced third-party checkout; strict-dynamic allows its follow-on loads */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
          nonce={nonce}
        />
      </body>
    </html>
  );
}
