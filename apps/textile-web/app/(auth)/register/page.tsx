import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; email?: string }>;
}) {
  const { invite = "", email = "" } = await searchParams;
  const isInviteFlow = Boolean(invite);

  return (
    <AuthLayout
      title={
        isInviteFlow ? "Complete your invitation" : "Start your textile passport workspace"
      }
      subtitle={
        isInviteFlow
          ? "Create your password to join your textile passport workspace"
          : "Set up your textile compliance workspace with product-specific onboarding"
      }
      type="register"
      productSlug="textile"
    >
      <RegisterForm
        inviteToken={invite}
        prefillEmail={email}
        productSlug="textile"
      />
    </AuthLayout>
  );
}
