import type { Metadata } from "next";

import "./globals.css";
import "flag-icons/css/flag-icons.min.css";

import { Source_Sans_3, Inter, JetBrains_Mono, Lexend } from "next/font/google"; // Source Sans 3 - Clean, professional body font
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", display: "swap" });

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
    <html lang="en">
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
        className={`${sourceSans.variable} ${inter.variable} ${jetbrainsMono.variable} ${lexend.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
