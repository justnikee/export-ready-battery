import { notFound } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { isProductSlug } from "@/lib/products";

type ProductForgotPasswordPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductForgotPasswordPage({
  params,
}: ProductForgotPasswordPageProps) {
  const { product } = await params;
  if (!isProductSlug(product)) {
    notFound();
  }

  return <ForgotPasswordForm productSlug={product} />;
}
