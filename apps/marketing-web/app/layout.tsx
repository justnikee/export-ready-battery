import type { Metadata } from "next";
import { Mona_Sans, Space_Grotesk, DM_Sans, DM_Mono, Barlow_Condensed, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import MotionProvider from "@/components/motion-provider";
import "./globals.css";

const monaSans = Mona_Sans({
  subsets: ["latin"],
  variable: "--font-mona-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const suisseEquiv = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-suisse",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
  weight: ["400", "500"],
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Anviora — Battery records for Indian pack exporters",
  description:
    "Serials, QR, a public passport page, and an India certificate vault for LMT, industrial >2 kWh, and EV packs. We are not a notified body and we do not file CPCB.",
  keywords: [
    "digital product passport",
    "battery passport",
    "EU Battery Regulation",
    "export compliance",
    "Indian manufacturers",
    "QR code passport",
  ],
  openGraph: {
    title: "Anviora — Battery records for Indian pack exporters",
    description:
      "Serials, QR, a public page, and an India certificate vault. LMT, industrial >2 kWh, and EV from 18 February 2027.",
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Anviora — Battery records for Indian pack exporters",
    description:
      "Serials, QR, a public page, and an India certificate vault. LMT, industrial >2 kWh, and EV from 18 February 2027.",
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
    "Software for Indian pack manufacturers to issue EU-scannable battery records — serials, QR, public page, certificate vault.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${monaSans.variable} ${spaceGrotesk.variable} ${suisseEquiv.variable} ${dmSans.variable} ${dmMono.variable} ${barlowCondensed.variable} antialiased`}>
      <body className="font-sans antialiased relative">
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
