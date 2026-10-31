import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import Footer from "@/components/sections/footer";

export const metadata: Metadata = {
  title: "Textile DPP — not currently offered | Anviora",
  description:
    "Anviora’s current product is battery records for Indian pack exporters. Textile DPP is not offered.",
  alternates: { canonical: "/textile" },
  robots: { index: false, follow: true },
};

export default function TextilePage() {
  return (
    <main className="relative min-h-screen bg-bg text-text overflow-x-clip">
      <SiteHeader />
      <section className="max-w-[720px] mx-auto px-6 pt-28 sm:pt-36 pb-24">
        <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-800 mb-3">
          Product scope
        </p>
        <h1 className="font-heading font-semibold text-[clamp(32px,4.6vw,48px)] tracking-[-0.04em] leading-[1.05] mb-4">
          Textile DPP is not currently offered.
        </h1>
        <p className="text-[16px] leading-[1.7] text-text-muted mb-6">
          Anviora’s live product is battery records for Indian pack
          manufacturers exporting to the EU: serials, QR, a public page, and
          an India certificate vault. We are not selling a textile Digital
          Product Passport and we are not working that product now.
        </p>
        <p className="text-[16px] leading-[1.7] text-text-muted mb-8">
          If you export batteries — especially LMT, industrial packs above 2
          kWh, or EV — start there.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/battery"
            className="inline-flex items-center justify-center h-12 px-7 text-[12px] font-mono font-bold tracking-widest uppercase text-emerald-400 bg-black hover:bg-slate-900 transition-all clip-chamfer"
          >
            Battery product
          </Link>
          <Link
            href="/request-access"
            className="inline-flex items-center justify-center h-12 px-7 text-[12px] font-mono font-bold tracking-widest uppercase text-black border-2 border-black hover:bg-black hover:text-emerald-400 transition-all clip-chamfer"
          >
            Request a walkthrough
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
