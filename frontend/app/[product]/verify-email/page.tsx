import { notFound } from "next/navigation";
import { VerifyEmailView } from "@/components/auth/verify-email-view";
import { isProductSlug } from "@/lib/products";

type ProductVerifyEmailPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductVerifyEmailPage({
  params,
}: ProductVerifyEmailPageProps) {
  const { product } = await params;
  if (!isProductSlug(product)) {
    notFound();
  }

  return <VerifyEmailView productSlug={product} />;
}
