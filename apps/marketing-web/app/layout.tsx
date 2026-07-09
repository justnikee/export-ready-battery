import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import MotionProvider from "@/components/motion-provider";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    siteName: SITE_NAME,
    url: SITE_URL,
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Digital Product Passport platform for Indian battery and textile exporters, automating EU compliance, certificate tracking, and QR-code verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} antialiased`}>
      <body className="font-sans antialiased">
        <MotionProvider>{children}</MotionProvider>
        <Toaster position="top-right" richColors />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
