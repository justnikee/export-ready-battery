import { notFound } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { getProductConfig, isProductSlug } from "@/lib/products";

type ProductRegisterPageProps = {
  params: Promise<{
    product: string;
  }>;
  searchParams: Promise<{
    invite?: string;
    email?: string;
  }>;
};

export default async function ProductRegisterPage({
  params,
  searchParams,
}: ProductRegisterPageProps) {
  const { product } = await params;
  if (!isProductSlug(product)) {
    notFound();
  }

  const config = getProductConfig(product);
  if (!config) {
    notFound();
  }

  const { invite = "", email = "" } = await searchParams;
  const isInviteFlow = Boolean(invite);

  return (
    <AuthLayout
      title={
        isInviteFlow ? "Complete your invitation" : config.auth.registerTitle
      }
      subtitle={
        isInviteFlow ? config.auth.inviteSubtitle : config.auth.registerSubtitle
      }
      type="register"
      productSlug={config.slug}
    >
      <RegisterForm
        inviteToken={invite}
        prefillEmail={email}
        productSlug={config.slug}
      />
    </AuthLayout>
  );
}
