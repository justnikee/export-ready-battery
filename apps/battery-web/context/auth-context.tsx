"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import api, { refreshAccessToken, setAccessToken } from "@/lib/api";
import { authApi } from "@/lib/auth-api";
import { useRouter } from "next/navigation";
import { productRoutes } from "@/lib/routes";
import { clearProductCookies, syncProductCookies } from "@/lib/product-session";

interface User {
  id: string;
  tenant_id: string;
  email: string;
  role?: string;
  company_name: string;
  address?: string;
  logo_url?: string;
  support_email?: string;
  website?: string;
  quota_balance?: number;
  // India Regulatory Compliance Fields
  epr_registration_number?: string;
  bis_r_number?: string;
  iec_code?: string;
  morth_manufacturer_code?: string;
  morth_factory_codes?: string;
  // EU Authorized Representative Fields
  eu_authorized_representative_name?: string;
  eu_authorized_representative_address?: string;
  eu_contact_email?: string;
  // Certificate Document Paths (Compliance Vault)
  epr_certificate_path?: string;
  bis_certificate_path?: string;
  pli_certificate_path?: string;
  // Document Verification Status (NOT_UPLOADED, PENDING, VERIFIED, REJECTED)
  epr_status?: string;
  bis_status?: string;
  pli_status?: string;
  // Onboarding status from DB
  onboarding_completed?: boolean;
  // Product type — set after Phase 1 backend lands; defaults to BATTERY
  product_type?: string;
  // Subscription plan + server-computed feature entitlements (UX gating only —
  // the backend's RequireFeature middleware is the real gate). See lib/entitlements.ts.
  plan_type?: string;
  plan_status?: string;
  plan_active?: boolean;
  subscription_expires_at?: string | null;
  entitlements?: Record<string, boolean>;
  // Data Visibility Preferences
  data_visibility?: Record<string, string>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User, redirectTo?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Login/register don't have a session yet — skip the refresh probe so a
    // logged-out visit doesn't look like a 401 failure in the network tab.
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (
        path === "/login" ||
        path === "/register" ||
        path === "/forgot-password" ||
        path === "/reset-password"
      ) {
        setLoading(false);
        return;
      }
    }

    // The access token lives in memory only, so on every fresh page load we
    // exchange the HttpOnly refresh_token cookie for a new one.
    const token = await refreshAccessToken();
    if (!token) {
      // No valid refresh session — user is not authenticated.
      clearProductCookies();
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
      syncProductCookies(response.data.product_type);
    } catch (error: unknown) {
      console.error("Auth check failed:", error);
      // Only clear tokens on genuine auth failures (401/403).
      // The axios interceptor already tried refreshing the token,
      // so if we still got here the session is truly dead.
      // For transient network errors, keep the existing session alive.
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 401 || status === 403) {
        setAccessToken(null);
        // Auth cookie is HttpOnly — backend clears it on logout.
        // Product cookies should still be cleared to avoid redirect loops.
        clearProductCookies();
      }
      // For non-auth errors (network timeout, 500, etc.) we
      // leave tokens in place so the user isn't randomly logged out.
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string, newUser: User, redirectTo?: string) => {
    setAccessToken(token);
    // Auth cookie is now HttpOnly (set by backend on login/refresh).
    // The in-memory access token is used for API Authorization headers.

    // Fetch the full user profile before committing state and navigating.
    // The minimal payload from /auth/login lacks onboarding_completed, which
    // causes DashboardLayoutInner to wrongly redirect existing users to /onboarding.
    // Fetching /auth/me here ensures the correct flag is present before the
    // dashboard layout ever mounts.
    let resolvedUser: User = newUser;
    try {
      const response = await api.get("/auth/me");
      resolvedUser = response.data;
    } catch {
      // /auth/me failed — fall back to the minimal user. The dashboard
      // layout will handle the redirect correctly on the next page load.
    }

    syncProductCookies(resolvedUser.product_type || newUser.product_type);
    setUser(resolvedUser);

    // Route to onboarding only when no explicit destination is given and the
    // profile is genuinely incomplete; explicit redirectTo always wins.
    const routes = productRoutes(resolvedUser.product_type);
    const destination = redirectTo
      ? redirectTo
      : resolvedUser.onboarding_completed
        ? routes.dashboard
        : routes.onboarding;
    router.push(destination);
  };

  const logout = async () => {
    // Capture product type before clearing user so we redirect to the correct login page.
    const routes = productRoutes(user?.product_type);
    await authApi.logout(); // revokes JTI server-side, clears localStorage + cookie
    clearProductCookies();
    // Defense in depth: dispatch's pending-scan cache is sessionStorage-scoped
    // now, but clear any leftover localStorage entry from before that change
    // (and sessionStorage, in case logout happens without closing the tab).
    localStorage.removeItem("dispatch_pending_items");
    sessionStorage.removeItem("dispatch_pending_items");
    setUser(null);
    router.push(routes.login);
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedUser });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
