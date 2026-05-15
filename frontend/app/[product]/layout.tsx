import { notFound } from "next/navigation";
import { isProductSlug } from "@/lib/products";

type ProductLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductLayout({
  children,
  params,
}: ProductLayoutProps) {
  const { product } = await params;

  if (!isProductSlug(product)) {
    notFound();
  }

  return children;
}
