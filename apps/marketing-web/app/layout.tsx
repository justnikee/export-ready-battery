import type { Metadata } from "next";
import { Inter, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Anviora — Digital Product Passports for Indian Battery & Textile Exporters",
  description:
    "Automate EU Battery Passport generation, certificate tracking, QR-code verification, and compliance gaps. Built for Indian manufacturers exporting to Europe.",
  keywords: [
    "digital product passport",
    "battery passport",
    "EU Battery Regulation",
    "export compliance",
    "Indian manufacturers",
    "BIS certification",
    "traceability",
    "textile compliance",
    "QR code passport",
  ],
  openGraph: {
    title: "Anviora — Digital Product Passports for Indian Exporters",
    description:
      "Automate EU Battery Passport generation, certificate tracking, and QR-code verification. Built for Indian manufacturers exporting to Europe.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anviora — Digital Product Passports for Indian Exporters",
    description:
      "Automate EU Battery Passport generation, certificate tracking, and QR-code verification. Built for Indian manufacturers exporting to Europe.",
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
    <html lang="en" className={`${inter.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
