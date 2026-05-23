import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnvayaLabs — Battery & Textile DPP Platform",
  description:
    "Digital Product Passport SaaS for regulatory compliance. Battery Passport and Textile DPP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
