"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
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
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, refreshToken: string, user: User) => void;
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
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
        } finally {
            setLoading(false);
        }
    };

    const login = (token: string, refreshToken: string, newUser: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', refreshToken);
        // Set cookie for middleware auth check (edge-level protection)
        document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        setUser(newUser);
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('onboarding_completed');
        // Clear auth cookie for middleware
        document.cookie = 'auth_token=; path=/; max-age=0';
        setUser(null);
        router.push('/login');
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
