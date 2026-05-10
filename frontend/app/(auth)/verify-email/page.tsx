"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, MailCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

type Status = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
      <div className="flex flex-col items-center gap-4 text-center py-8">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand)]" />
        <p className="text-sm text-muted-foreground">Verifying your email…</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-5 text-center py-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)]/10">
          <MailCheck className="h-8 w-8 text-[var(--brand)]" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl text-foreground">Email verified!</h2>
          <p className="text-sm text-muted-foreground">
            Your account is now active. You can sign in anytime.
          </p>
        </div>
        <Button
          onClick={() => router.push("/login")}
          variant="accent"
          className="h-11 w-full rounded-md"
        >
          Go to Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center py-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl text-foreground">Verification failed</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Button
        onClick={() => router.push("/login")}
        variant="outline"
        className="h-11 w-full border-border text-foreground rounded-md"
      >
        Back to Sign in
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-12 px-4">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl text-foreground">Email Verification</h1>
      </div>
      <div className="rounded-lg border border-border bg-card p-6 shadow-none">
        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
