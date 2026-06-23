import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";
import { authApi } from "@/lib/auth-api";
import { useNavigate } from "react-router-dom";

export interface User {
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
  epr_registration_number?: string;
  bis_r_number?: string;
  iec_code?: string;
  morth_manufacturer_code?: string;
  morth_factory_codes?: string;
  eu_authorized_representative_name?: string;
  eu_authorized_representative_address?: string;
  eu_contact_email?: string;
  epr_certificate_path?: string;
  bis_certificate_path?: string;
  pli_certificate_path?: string;
  epr_status?: string;
  bis_status?: string;
  pli_status?: string;
  onboarding_completed?: boolean;
  data_visibility?: Record<string, string>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, newUser: User, redirectTo?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
    } catch (error: unknown) {
      console.error("Auth check failed:", error);
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string, newUser: User, redirectTo?: string) => {
    localStorage.setItem("token", token);

    let resolvedUser: User = newUser;
    try {
      const response = await api.get("/auth/me");
      resolvedUser = response.data;
    } catch {
      // fall back to minimal user
    }

    setUser(resolvedUser);

    const destination = redirectTo || "/dashboard";
    navigate(destination);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    navigate("/login");
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
