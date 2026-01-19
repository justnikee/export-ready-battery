import { DocsLayout } from '@/components/docs';

export default function DocsRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DocsLayout>{children}</DocsLayout>;
}
