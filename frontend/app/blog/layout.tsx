import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="dark font-sans bg-[#0a0a0a] text-foreground min-h-screen flex flex-col">
            <PublicHeader />
            <main className="flex-1">
                {children}
            </main>
            <PublicFooter />
        </div>
    );
}
