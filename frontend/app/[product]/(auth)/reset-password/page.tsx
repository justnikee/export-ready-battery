import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { isProductSlug } from "@/lib/products";

type ProductResetPasswordPageProps = {
  params: Promise<{
    product: string;
  }>;
};

function ProductResetPasswordContent({
  product,
}: {
  product: "battery" | "textile";
}) {
  return <ResetPasswordForm productSlug={product} />;
}

export default async function ProductResetPasswordPage({
  params,
}: ProductResetPasswordPageProps) {
  const { product } = await params;
  if (!isProductSlug(product)) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-(--brand)" />
        </div>
      }
    >
      <ProductResetPasswordContent product={product} />
    </Suspense>
  );
}
