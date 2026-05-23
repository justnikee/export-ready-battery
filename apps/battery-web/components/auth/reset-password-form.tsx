"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "./auth-layout";
import api from "@/lib/api";
import { toast } from "sonner";
import { Lock, Loader2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { type ProductSlug } from "@/lib/products";
import { productRoutesFromSlug } from "@/lib/routes";

type ResetPasswordFormProps = {
  productSlug: ProductSlug;
};

export function ResetPasswordForm({ productSlug }: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routes = productRoutesFromSlug(productSlug);
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordChecks = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
  };
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordChecks.minLength) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.post("/auth/reset-password", {
        token,
        new_password: password,
      });
      setIsSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => router.push(routes.login), 2000);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } };
      const errorMessage =
        apiError.response?.data?.error || "Failed to reset password";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !token) {
    return (
      <AuthLayout
        title="Invalid link"
        subtitle="This password reset link is invalid or has expired"
        type="login"
        productSlug={productSlug}
      >
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>

          <p className="text-muted-foreground">
            Please request a new password reset link.
          </p>

          <div className="flex flex-col gap-3">
            <Link href={routes.forgotPassword} className="w-full">
              <Button variant="accent" className="w-full h-11 rounded-md">
                Request new link
              </Button>
            </Link>
            <Link href={routes.login} className="w-full">
              <Button
                variant="ghost"
                className="w-full h-11 text-muted-foreground rounded-md"
              >
                Back to login
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (isSuccess) {
    return (
      <AuthLayout
        title="Password reset!"
        subtitle="Your password has been successfully updated"
        type="login"
        productSlug={productSlug}
      >
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-(--brand)/10">
            <CheckCircle className="h-8 w-8 text-(--brand)" />
          </div>

          <p className="text-muted-foreground">Redirecting you to login...</p>

          <Link href={routes.login} className="w-full">
            <Button variant="accent" className="w-full h-11 rounded-md">
              Continue to login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your new password below"
      type="login"
      productSlug={productSlug}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New Password */}
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            New Password
          </Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-(--brand)">
              <Lock className="h-5 w-5" />
            </div>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 rounded-md border-border pl-10 pr-10 transition-all focus:border-(--brand) focus:ring-(--brand)/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {password.length > 0 && (
            <div className="space-y-1 mt-2">
              <div
                className={`flex items-center gap-2 text-xs ${passwordChecks.minLength ? "text-(--brand)" : "text-muted-foreground"}`}
              >
                {passwordChecks.minLength ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                At least 8 characters
              </div>
              <div
                className={`flex items-center gap-2 text-xs ${passwordChecks.hasLetter ? "text-(--brand)" : "text-muted-foreground"}`}
              >
                {passwordChecks.hasLetter ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                Contains a letter
              </div>
              <div
                className={`flex items-center gap-2 text-xs ${passwordChecks.hasNumber ? "text-(--brand)" : "text-muted-foreground"}`}
              >
                {passwordChecks.hasNumber ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                Contains a number
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Confirm Password
          </Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-(--brand)">
              <Lock className="h-5 w-5" />
            </div>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-12 rounded-md border-border pl-10 pr-10 transition-all focus:border-(--brand) focus:ring-(--brand)/20"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {confirmPassword.length > 0 && (
            <div
              className={`flex items-center gap-2 text-xs ${passwordsMatch ? "text-(--brand)" : "text-destructive"}`}
            >
              {passwordsMatch ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {passwordsMatch ? "Passwords match" : "Passwords do not match"}
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || !passwordsMatch || !passwordChecks.minLength}
          variant="accent"
          className="w-full h-12 rounded-md disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
