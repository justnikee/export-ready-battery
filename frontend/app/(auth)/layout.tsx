import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="dark min-h-screen flex flex-col bg-zinc-950 text-zinc-50 font-sans">
            <PublicHeader />
            <main className="flex-1 flex items-center justify-center p-4">
                {children}
            </main>
            <PublicFooter />
        </div>
    );
}
