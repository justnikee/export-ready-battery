import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

function ResetPasswordContent() {
  return <ResetPasswordForm productSlug="battery" />;
}

export default async function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-(--brand)" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
