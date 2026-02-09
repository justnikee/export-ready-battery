import api from './api';

export interface LoginResponse {
    token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string;
        full_name: string;
        company_id: string;
        role: string;
    };
    error?: string;
}

export interface RegisterParams {
    email: string;
    password: string;
    company_name: string;
    full_name: string;
}

export interface RegisterResponse {
    token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string;
        full_name: string;
        company_id: string;
        role: string;
    };
    error?: string;
}

export const authApi = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await api.post('/auth/login', { email, password });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('refresh_token', response.data.refresh_token);
                // Set cookie for middleware
                document.cookie = `auth_token=${response.data.token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
            }

            return response.data;
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { error?: string } } };
                return {
                    error: axiosError.response?.data?.error || 'Login failed. Please try again.',
                    token: '',
                    refresh_token: '',
                    user: { id: '', email: '', full_name: '', company_id: '', role: '' }
                };
            }
            return {
                error: 'An unexpected error occurred.',
                token: '',
                refresh_token: '',
                user: { id: '', email: '', full_name: '', company_id: '', role: '' }
            };
        }
    },

    register: async (params: RegisterParams): Promise<RegisterResponse> => {
        try {
            const response = await api.post('/auth/register', params);

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('refresh_token', response.data.refresh_token);
                // Set cookie for middleware
                document.cookie = `auth_token=${response.data.token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
            }

            return response.data;
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { error?: string } } };
                return {
                    error: axiosError.response?.data?.error || 'Registration failed. Please try again.',
                    token: '',
                    refresh_token: '',
                    user: { id: '', email: '', full_name: '', company_id: '', role: '' }
                };
            }
            return {
                error: 'An unexpected error occurred.',
                token: '',
                refresh_token: '',
                user: { id: '', email: '', full_name: '', company_id: '', role: '' }
            };
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        document.cookie = 'auth_token=; path=/; max-age=0';
    }
};
