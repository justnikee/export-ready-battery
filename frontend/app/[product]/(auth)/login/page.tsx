import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { getProductConfig, isProductSlug } from "@/lib/products";

type ProductLoginPageProps = {
  params: Promise<{
    product: string;
  }>;
};

export default async function ProductLoginPage({
  params,
}: ProductLoginPageProps) {
  const { product } = await params;
  if (!isProductSlug(product)) {
    notFound();
  }

  const config = getProductConfig(product);
  if (!config) {
    notFound();
  }

  return (
    <AuthLayout
      title={config.auth.loginTitle}
      subtitle={config.auth.loginSubtitle}
      type="login"
      productSlug={config.slug}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0B1F3B] border-t-transparent" />
          </div>
        }
      >
        <LoginForm productSlug={config.slug} />
      </Suspense>
    </AuthLayout>
  );
}
