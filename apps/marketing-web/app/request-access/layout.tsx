import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request Access | Anviora",
  description:
    "Request early access to Anviora's Digital Product Passport platform for Indian battery and textile exporters.",
  alternates: { canonical: "/request-access" },
};

export default function RequestAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
