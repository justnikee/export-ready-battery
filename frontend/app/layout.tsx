import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter - Clean body font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="en" className="dark">
      <head>
        {/* Mona Sans - GitHub's custom variable font for headings */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@mona-sans/webfont@1.0.0/index.min.css"
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
