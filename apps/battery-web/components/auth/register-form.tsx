"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Lock,
  Building2,
  Loader2,
  Eye,
  EyeOff,
  Check,
  X,
  MailCheck,
} from "lucide-react";
import { authApi, type RegisterParams } from "@/lib/auth-api";
import {
  getPasswordRequirements,
  isPasswordValid,
} from "@/lib/password-policy";
import { toast } from "sonner";
import { type ProductSlug, productSlugToType } from "@/lib/products";
import { productRoutesFromSlug } from "@/lib/routes";
import { getOAuthStartPath } from "@/lib/api-origin";

type RegisterFormProps = {
  inviteToken?: string;
  prefillEmail?: string;
  productSlug: ProductSlug;
};

export function RegisterForm({
  inviteToken = "",
  prefillEmail = "",
  productSlug,
}: RegisterFormProps) {
  const router = useRouter();
  const routes = productRoutesFromSlug(productSlug);

  const isInviteFlow = Boolean(inviteToken);

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  const passwordRequirements = getPasswordRequirements(password, email);
  const allRequirementsMet = isPasswordValid(password, email);
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      toast.error("Please meet all password requirements");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!tosAccepted) {
      toast.error(
        "Please accept the Terms of Service and Privacy Policy to continue",
      );
      return;
    }

    setIsLoading(true);

    try {
      const payload: RegisterParams = {
        email,
        password,
        company_name: companyName,
        product_type: productSlugToType(productSlug),
        ...(isInviteFlow && { invite_token: inviteToken }),
      };

      const response = await authApi.register(payload);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      if (isInviteFlow) {
        toast.success("Account created! You can now log in.");
        router.push(routes.login);
        return;
      }

      setRegistered(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Verify-email confirmation screen ───────────────────────────────────────
  if (registered) {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)]/10">
          <MailCheck className="h-8 w-8 text-[var(--brand)]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl text-foreground">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a verification link to{" "}
            <span className="text-foreground font-medium">{email}</span>.
            <br />
            Click the link to activate your account and sign in.
          </p>
        </div>

        <div className="w-full rounded-lg border border-border bg-card p-4 text-left space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Didn&apos;t get it?
          </p>
          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
            <li>Check your spam / junk folder</li>
            <li>The link expires in 24 hours</li>
          </ul>
          <ResendButton email={email} />
        </div>
      </div>
    );
  }

  // ── Registration form ──────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Company Name */}
      {!isInviteFlow && (
        <div className="space-y-2">
          <Label
            htmlFor="company"
            className="text-sm font-medium text-foreground"
          >
            Company / Manufacturer name
          </Label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[var(--brand)] transition-colors">
              <Building2 className="h-5 w-5" />
            </div>
            <Input
              id="company"
              placeholder="e.g. Luminex Energy Pvt. Ltd."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="pl-10 h-12 border-border focus:border-[var(--brand)] focus:ring-[var(--brand)]/20 transition-all rounded-md"
            />
          </div>
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Business email
        </Label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[var(--brand)] transition-colors">
            <Mail className="h-5 w-5" />
          </div>
          <Input
            id="email"
            type="email"
            placeholder="you@yourcompany.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={isInviteFlow && Boolean(prefillEmail)}
            required
            className="pl-10 h-12 border-border focus:border-[var(--brand)] focus:ring-[var(--brand)]/20 transition-all rounded-md read-only:opacity-70 read-only:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          Password
        </Label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[var(--brand)] transition-colors">
            <Lock className="h-5 w-5" />
          </div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            required
            className="pl-10 pr-10 h-12 border-border focus:border-[var(--brand)] focus:ring-[var(--brand)]/20 transition-all rounded-md"
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

        {/* Password Requirements */}
        {(passwordFocused || password.length > 0) && (
          <div className="mt-3 p-3 bg-card border border-border rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Password requirements:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {passwordRequirements.map((req) => (
                <div key={req.id} className="flex items-center gap-1.5">
                  {req.met ? (
                    <Check className="h-3.5 w-3.5 text-[var(--brand)]" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span
                    className={`text-xs ${req.met ? "text-[var(--brand)]" : "text-muted-foreground"}`}
                  >
                    {req.label}
                  </span>
                </div>
              ))}
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
          Confirm password
        </Label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[var(--brand)] transition-colors">
            <Lock className="h-5 w-5" />
          </div>
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="pl-10 pr-10 h-12 border-border focus:border-[var(--brand)] focus:ring-[var(--brand)]/20 transition-all rounded-md"
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
          <p
            className={`text-xs ${passwordsMatch ? "text-[var(--brand)]" : "text-destructive"}`}
          >
            {passwordsMatch ? "✓ Passwords match" : "Passwords do not match"}
          </p>
        )}
      </div>

      {/* Terms */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="tos-accept"
          checked={tosAccepted}
          onCheckedChange={(checked) => setTosAccepted(checked === true)}
          className="mt-0.5 border-border data-[state=checked]:border-[var(--brand)] data-[state=checked]:bg-[var(--brand)]"
        />
        <label
          htmlFor="tos-accept"
          className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
        >
          I have read and agree to the{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--brand)] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--brand)] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Privacy Policy
          </a>
          . <span className="text-destructive">*</span>
        </label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={
          isLoading || !allRequirementsMet || !passwordsMatch || !tosAccepted
        }
        variant="accent"
        className="w-full h-12 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            or continue with
          </span>
        </div>
      </div>

      {/* Social Login */}
      <div>
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-border hover:bg-accent text-foreground rounded-md"
          onClick={() => {
            window.location.href = getOAuthStartPath("google");
          }}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>
      </div>
    </form>
  );
}

// ── Inline resend button ─────────────────────────────────────────────────────
function ResendButton({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      await authApi.resendVerification(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <p className="mt-2 text-xs font-medium text-[var(--brand)]">
        ✓ Email sent again!
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={loading}
      className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--brand)] underline underline-offset-2 hover:opacity-80 disabled:opacity-60"
    >
      {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      Resend verification email
    </button>
  );
}
