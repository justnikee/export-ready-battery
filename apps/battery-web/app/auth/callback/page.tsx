"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { refreshAccessToken } from "@/lib/api";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { productRoutes } from "@/lib/routes";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const loginRef = useRef(login);
  const tenantId = searchParams.get("tenant_id");
  const email = searchParams.get("email");
  const companyName = searchParams.get("company_name") || "";
  const productType = searchParams.get("product_type");
  const routes = productRoutes(productType);
  // S-06: access JWT is no longer passed in the URL. Session is rehydrated
  // from the HttpOnly refresh_token cookie set by the OAuth redirect response.
  const oauth = searchParams.get("oauth");
  const error =
    searchParams.get("error") ||
    (!oauth || !tenantId || !email
      ? "Missing authentication data. Please try again."
      : null);

  useEffect(() => {
    loginRef.current = login;
  }, [login]);

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (error) {
      return;
    }

    if (!oauth || !tenantId || !email) {
      return;
    }

    // Exchange HttpOnly refresh cookie for an in-memory access token.
    // Do not write auth tokens to document.cookie (XSS surface).
    refreshAccessToken()
      .then((token) => {
        if (!token) {
          throw new Error("No session after OAuth");
        }
        return loginRef.current(token, {
          id: tenantId,
          tenant_id: tenantId,
          email: email,
          company_name: companyName,
          product_type: productType || undefined,
        });
      })
      .catch(() => {
        // Fall through to error UI via location if login fails
        window.location.href = `${routes.login}?error=oauth_session`;
      });
  }, [companyName, email, error, oauth, productType, routes.login, tenantId]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-destructive text-center max-w-sm">{error}</p>
        <Link href={routes.login} className="text-sm underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Completing sign-in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
