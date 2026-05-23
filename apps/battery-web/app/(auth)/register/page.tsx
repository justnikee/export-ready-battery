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
        isInviteFlow ? "Complete your invitation" : "Get started with AnvayaLabs"
      }
      subtitle={
        isInviteFlow
          ? "Create your password to join your battery passport workspace"
          : "Set up your battery passport workspace in under 2 minutes"
      }
      type="register"
      productSlug="battery"
    >
      <RegisterForm
        inviteToken={invite}
        prefillEmail={email}
        productSlug="battery"
      />
    </AuthLayout>
  );
}
