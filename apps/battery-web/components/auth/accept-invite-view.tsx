"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { getProductConfig, type ProductSlug } from "@/lib/products";
import { productRoutesFromSlug } from "@/lib/routes";

type InviteResponse = {
  register_url?: string;
  dashboard_url?: string;
};

function AcceptInviteContent({ productSlug }: { productSlug: ProductSlug }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const hasToken = Boolean(token);
  const routes = productRoutesFromSlug(productSlug);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    hasToken ? "loading" : "error",
  );
  const [message, setMessage] = useState(
    hasToken
      ? "Verifying invitation..."
      : "Invalid invitation link. Token is missing.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const acceptInvite = async () => {
      try {
        const response = await api.post<InviteResponse>("/team/accept", {
          token,
        });

        if (response.status === 202) {
          const data = response.data;
          setStatus("success");
          setMessage("Invitation valid. Redirecting to registration...");
          setTimeout(() => {
            router.push(
              data.register_url || `${routes.register}?invite=${token}`,
            );
          }, 1200);
          return;
        }

        const data = response.data;
        setStatus("success");
        setMessage("Invitation accepted! Redirecting to your workspace...");
        setTimeout(() => {
          router.push(data.dashboard_url || routes.dashboard);
        }, 1200);
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { error?: string } } };
        setStatus("error");
        setMessage(
          apiError.response?.data?.error ||
            "Failed to accept invitation. It may have expired.",
        );
      }
    };

    acceptInvite();
  }, [productSlug, router, routes.dashboard, routes.register, token]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-(--brand)" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <CheckCircle2 className="h-10 w-10 text-(--brand)" />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="text-sm font-medium text-destructive">{message}</p>
      <Button
        variant="outline"
        className="mt-2"
        onClick={() => router.push(routes.login)}
      >
        Return to Login
      </Button>
    </div>
  );
}

export function AcceptInviteView({
  productSlug,
}: {
  productSlug: ProductSlug;
}) {
  const product = getProductConfig(productSlug);
  const subtitle = product
    ? `We are validating your invite to the ${product.label.toLowerCase()} workspace.`
    : "We are validating your team invitation.";

  return (
    <AuthLayout
      title="Team Invitation"
      subtitle={subtitle}
      type="register"
      productSlug={productSlug}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-(--brand)" />
          </div>
        }
      >
        <AcceptInviteContent productSlug={productSlug} />
      </Suspense>
    </AuthLayout>
  );
}
