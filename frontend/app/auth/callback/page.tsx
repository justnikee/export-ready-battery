"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const { login, refreshUser } = useAuth();
  const loginRef = useRef(login);
  const refreshRef = useRef(refreshUser);
  const token = searchParams.get("token");
  const tenantId = searchParams.get("tenant_id");
  const email = searchParams.get("email");
  const companyName = searchParams.get("company_name") || "";
  const error =
    searchParams.get("error") ||
    (!token || !tenantId || !email
      ? "Missing authentication data. Please try again."
      : null);

  useEffect(() => {
    loginRef.current = login;
    refreshRef.current = refreshUser;
  }, [login, refreshUser]);

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (error) {
      return;
    }

    if (!token || !tenantId || !email) {
      return;
    }

    // Store access token so /auth/me can be called with Authorization header
    // The HttpOnly refresh_token cookie is already set by the backend redirect
    localStorage.setItem("token", token);
    document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

    // Fetch full user from /auth/me so onboarding_completed is populated.
    // login() will then route correctly: /onboarding for new accounts, /dashboard for existing.
    refreshRef
      .current()
      .then(() => {
        // refreshUser() updated the auth context — login() will now see the real onboarding state
        loginRef.current(token, {
          id: tenantId,
          tenant_id: tenantId,
          email: email,
          company_name: companyName,
          // onboarding_completed not set here — refreshUser already updated context
        });
      })
      .catch(() => {
        // /auth/me failed — fall back to minimal user; dashboard layout will fix the redirect
        loginRef.current(token, {
          id: tenantId,
          tenant_id: tenantId,
          email: email,
          company_name: companyName,
        });
      });
  }, [companyName, email, error, tenantId, token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <span className="text-red-500 text-xl">!</span>
          </div>
          <h2 className="text-lg text-[#0B1F3B]">Authentication Failed</h2>
          <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
          <a
            href="/login"
            className="inline-block mt-2 px-6 py-2 bg-[#0B1F3B] text-white text-sm font-medium hover:bg-[#0B1F3B]/90 transition-colors"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F7A5F] mx-auto" />
        <p className="text-sm text-muted-foreground">Completing sign-in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-[#1F7A5F]" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
