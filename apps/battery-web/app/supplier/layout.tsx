import type { Metadata, Viewport } from "next";
import SupplierCacheCleanup from "./supplier-cache-cleanup";

export const metadata: Metadata = {
  title: "Supplier Portal — ExportReady",
  description: "Upload CoCs, audit reports, and provenance data",
  manifest: "/manifest-supplier.json",
};

export const viewport: Viewport = {
  themeColor: "#37322F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <SupplierCacheCleanup />
    </>
  );
}
