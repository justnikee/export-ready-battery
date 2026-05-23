import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import "../globals.css";

export default function MarketingLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
 <div className="font-sans bg-white text-gray-900 min-h-screen flex flex-col">
 <PublicHeader />
 <main className="flex-1">
 {children}
 </main>
 <PublicFooter />
 </div>
 );
}
