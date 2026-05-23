"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MailCheck, XCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { getProductConfig, type ProductSlug } from "@/lib/products";
import { productRoutesFromSlug } from "@/lib/routes";

type Status = "verifying" | "success" | "error";

function VerifyEmailContent({ productSlug }: { productSlug: ProductSlug }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const routes = productRoutesFromSlug(productSlug);
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [message, setMessage] = useState(
    token ? "" : "No verification token found in the link.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setStatus("error");
        setMessage(
          axiosErr.response?.data?.error ||
            "This verification link has expired or is invalid.",
        );
      });
  }, [token]);

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-(--brand)" />
        <p className="text-sm text-muted-foreground">Verifying your email...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--brand)/10">
          <MailCheck className="h-8 w-8 text-(--brand)" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl text-foreground">Email verified!</h2>
          <p className="text-sm text-muted-foreground">
            Your account is now active. You can sign in anytime.
          </p>
        </div>
        <Button
          onClick={() => router.push(routes.login)}
          variant="accent"
          className="h-11 w-full rounded-md"
        >
          Go to Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl text-foreground">Verification failed</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Button
        onClick={() => router.push(routes.login)}
        variant="outline"
        className="h-11 w-full rounded-md border-border text-foreground"
      >
        Back to Sign in
      </Button>
    </div>
  );
}

export function VerifyEmailView({ productSlug }: { productSlug: ProductSlug }) {
  const product = getProductConfig(productSlug);
  const title = product
    ? `${product.label} Email Verification`
    : "Email Verification";
  const subtitle = product
    ? `Complete activation for your ${product.label.toLowerCase()} workspace`
    : "Complete your account activation";

  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      type="login"
      productSlug={productSlug}
    >
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-(--brand)" />
          </div>
        }
      >
        <VerifyEmailContent productSlug={productSlug} />
      </Suspense>
    </AuthLayout>
  );
}
