"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { authApi } from '@/lib/auth-api';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    tenant_id: string;
    email: string;
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
    // Data Visibility Preferences
    data_visibility?: Record<string, string>;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, refreshToken: string, user: User, redirectTo?: string) => void;
    logout: () => void;
    refreshUser: () => Promise<User | null>;
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

    const checkAuth = async (): Promise<User | null> => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return null;
        }

        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
            return response.data as User;
        } catch (error: unknown) {
            console.error('Auth check failed:', error);
            // Only clear tokens on genuine auth failures (401/403).
            // The axios interceptor already tried refreshing the token,
            // so if we still got here the session is truly dead.
            // For transient network errors, keep the existing session alive.
            const status = (error as { response?: { status?: number } })?.response?.status;
            if (status === 401 || status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
                document.cookie = 'auth_token=; path=/; max-age=0';
            }
            // For non-auth errors (network timeout, 500, etc.) we
            // leave tokens in place so the user isn't randomly logged out.
            return null;
        } finally {
            setLoading(false);
        }
    };

    const login = (token: string, refreshToken: string, newUser: User, redirectTo?: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', refreshToken);
        // Set cookie for middleware auth check (edge-level protection)
        document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        setUser(newUser);
        // Route to onboarding if profile is not yet completed; explicit redirectTo always wins
        const destination = redirectTo
            ? redirectTo
            : newUser.onboarding_completed
                ? '/dashboard'
                : '/onboarding'
        router.push(destination);
    };

    const logout = async () => {
        await authApi.logout(); // revokes JTI server-side, clears localStorage + cookie
        setUser(null);
        router.push('/login');
    };

    const refreshUser = async (): Promise<User | null> => {
        return await checkAuth();
    };

    const updateUser = (updatedUser: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...updatedUser });
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
