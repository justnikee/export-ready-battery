import api from './api';

export interface AuthResponse {
    token: string;
    refresh_token: string;
    tenant_id: string;
    email: string;
    company_name: string;
    expires_in: number;
    error?: string;
}

export interface RegisterParams {
    email: string;
    password: string;
    company_name: string;
}

export const authApi = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        try {
            const response = await api.post('/auth/login', { email, password });
            return response.data;
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { error?: string } } };
                return {
                    error: axiosError.response?.data?.error || 'Login failed. Please try again.',
                    token: '',
                    refresh_token: '',
                    tenant_id: '',
                    email: '',
                    company_name: '',
                    expires_in: 0,
                };
            }
            return {
                error: 'An unexpected error occurred.',
                token: '',
                refresh_token: '',
                tenant_id: '',
                email: '',
                company_name: '',
                expires_in: 0,
            };
        }
    },

    register: async (params: RegisterParams): Promise<AuthResponse> => {
        try {
            const response = await api.post('/auth/register', params);
            return response.data;
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { error?: string } } };
                return {
                    error: axiosError.response?.data?.error || 'Registration failed. Please try again.',
                    token: '',
                    refresh_token: '',
                    tenant_id: '',
                    email: '',
                    company_name: '',
                    expires_in: 0,
                };
            }
            return {
                error: 'An unexpected error occurred.',
                token: '',
                refresh_token: '',
                tenant_id: '',
                email: '',
                company_name: '',
                expires_in: 0,
            };
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        document.cookie = 'auth_token=; path=/; max-age=0';
    }
};
