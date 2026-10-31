"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "./auth-layout";
import api from "@/lib/api";
import { toast } from "sonner";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { type ProductSlug } from "@/lib/products";
import { productRoutesFromSlug } from "@/lib/routes";

type ForgotPasswordFormProps = {
  productSlug: ProductSlug;
};

export function ForgotPasswordForm({ productSlug }: ForgotPasswordFormProps) {
  const routes = productRoutesFromSlug(productSlug);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
    } catch {
      // Same copy either way — do not reveal whether the address exists.
    } finally {
      setIsSubmitted(true);
      toast.success(
        "If an account exists for that email, reset instructions will be sent",
      );
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent password reset instructions"
        type="login"
        productSlug={productSlug}
      >
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-[var(--brand)]/10 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-[var(--brand)]" />
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground">
              If an account exists for{" "}
              <span className="font-medium text-foreground">{email}</span>,
              you&apos;ll receive an email with instructions to reset your
              password.
            </p>
            <p className="text-muted-foreground text-sm">
              Didn&apos;t receive an email? Check your spam folder or try again.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="w-full h-11 border-border text-muted-foreground rounded-md"
            >
              Try another email
            </Button>

            <Link href={routes.login} className="w-full">
              <Button
                variant="ghost"
                className="w-full h-11 text-[var(--brand)] hover:bg-[var(--brand)]/10 rounded-md"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you reset instructions"
      type="login"
      productSlug={productSlug}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email address
          </Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[var(--brand)] transition-colors">
              <Mail className="h-5 w-5" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 h-12 border-border focus:border-[var(--brand)] focus:ring-[var(--brand)]/20 transition-all rounded-md"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          variant="accent"
          className="w-full h-12 rounded-md"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send reset instructions"
          )}
        </Button>

        <div className="text-center">
          <Link
            href={routes.login}
            className="inline-flex items-center text-sm text-[var(--brand)] hover:underline transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
