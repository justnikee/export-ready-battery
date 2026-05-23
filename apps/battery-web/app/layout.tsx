import type { Metadata } from "next";

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
  title: "AnvayaLabs - Digital Battery Passport",
  description: "Manage and track battery passports",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Razorpay Checkout Script */}
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          defer
        ></script>
      </head>
      <body
        className={`${inter.variable} ${sourceCodePro.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
