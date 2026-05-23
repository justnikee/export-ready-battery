import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
export default async function Page() {
  return (
    <AuthLayout
      title={"Welcome back"}
      subtitle={"Sign in to manage your textile passports and supply chain compliance"}
      type="login"
      productSlug={"textile"}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0B1F3B] border-t-transparent" />
          </div>
        }
      >
        <LoginForm productSlug={"textile"} />
      </Suspense>
    </AuthLayout>
  );
}
