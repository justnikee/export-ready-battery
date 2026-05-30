import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
  display: "swap",
  preload: true,
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
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased bg-[#F7F5F3] text-[#37322F]">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
