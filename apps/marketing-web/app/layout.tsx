import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ExportReady | AI-Powered Compliance for Indian Battery & Textile Exporters",
  description:
    "Automate EU Battery Passport generation, certificate tracking, and QR-code verification. Built for Indian manufacturers exporting to Europe.",
  keywords: [
    "battery passport",
    "EU Battery Regulation",
    "export compliance",
    "Indian exporters",
    "BIS certification",
    "EPR registration",
    "textile compliance",
  ],
  openGraph: {
    title: "ExportReady — Ship to Europe Without the Compliance Nightmare",
    description:
      "AI-powered Battery Passports, QR-code verification, and automated compliance tracking.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "ExportReady — Ship to Europe Without the Compliance Nightmare",
    description:
      "AI-powered Battery Passports, QR-code verification, and automated compliance tracking.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
