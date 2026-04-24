import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";

type RegisterPageProps = {
  searchParams: Promise<{
    invite?: string;
    email?: string;
  }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { invite = "", email = "" } = await searchParams;
  const isInviteFlow = Boolean(invite);

  return (
    <AuthLayout
      title={
        isInviteFlow
          ? "Complete your invitation"
          : "Get started with ExportLens"
      }
      subtitle={
        isInviteFlow
          ? "Create your password to join your battery passport workspace"
          : "Set up your battery passport workspace in under 2 minutes"
      }
      type="register"
    >
      <RegisterForm inviteToken={invite} prefillEmail={email} />
    </AuthLayout>
  );
}
