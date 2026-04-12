import type { Metadata } from "next";

import "./globals.css";
import "flag-icons/css/flag-icons.min.css";

import { Inter, Source_Code_Pro } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sourceCodePro = Source_Code_Pro({ subsets: ["latin"], variable: "--font-source-code", display: "swap" });

import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "ExportReady - Digital Battery Passport",
  description: "Manage and track battery passports",
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
        <script src="https://checkout.razorpay.com/v1/checkout.js" defer></script>
        {/* Material Symbols for landing icons */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className={`${inter.variable} ${sourceCodePro.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
