import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anviora — Digital Product Passport Infrastructure",
  description:
    "Create verifiable digital passports, supplier records, and audit evidence for Indian battery and textile manufacturers selling into Europe.",
  keywords: [
    "digital product passport",
    "battery passport",
    "EU Battery Regulation",
    "export compliance",
    "Indian manufacturers",
    "BIS certification",
    "traceability",
    "textile compliance",
  ],
  openGraph: {
    title: "Anviora — Compliance Infrastructure to Grow Your Exports",
    description:
      "Create verifiable digital passports, supplier records, and audit evidence for Indian manufacturers.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anviora — Compliance Infrastructure to Grow Your Exports",
    description:
      "Create verifiable digital passports, supplier records, and audit evidence for Indian manufacturers.",
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
    <html lang="en" className={`${inter.variable} ${geistMono.variable} antialiased`}>
      <body className="font-sans antialiased bg-white text-[#0d253d]">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
