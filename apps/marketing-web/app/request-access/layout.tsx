import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request Access | Anviora",
  description:
    "Request a walkthrough of Anviora battery records for Indian pack exporters.",
  alternates: { canonical: "/request-access" },
};

export default function RequestAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
