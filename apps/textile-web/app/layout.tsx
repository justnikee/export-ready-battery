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

export const metadata: Metadata = {
  title: "AnvayaLabs - Digital Textile Passport",
  description: "Manage and track textile passports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
