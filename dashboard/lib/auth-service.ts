import api, { tokenUtils } from './api';
import { AxiosError } from 'axios';

// Types
export interface User {
    id: string;
    _id?: string;
    fullName: string;
    email: string;
    role: 'user' | 'restaurant' | 'admin' | 'ngo';
    isVerified?: boolean;
    isVerifiedNGO?: boolean;
    ngoName?: string;
    ngoRegNumber?: string;
    totalCarbonSaved?: number;
    totalMealsRescued?: number;
    restaurant?: {
        id: string;
        name: string;
        logo?: string;
    };
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    role?: 'user' | 'restaurant' | 'ngo';
    ngoRegNumber?: string;
    ngoName?: string;
    ngoAddress?: string;
    ngoMission?: string;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
    requiresVerification?: boolean;
    phone?: string;
    restaurant?: {
        id: string;
        name: string;
        isVerified?: boolean;
        isActive?: boolean;
    };
}

// API Error type
interface ApiErrorResponse {
    success: boolean;
    message: string;
    requiresVerification?: boolean;
    phone?: string;
    error?: {
        code: string;
        message: string;
    };
}

// Auth Service Functions
export const authService = {
    /**
     * Unified Login for all roles (User, Restaurant, NGO)
     */
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        try {
            const response = await api.post<AuthResponse>('/auth/login', credentials);

            if (response.data.accessToken) {
                tokenUtils.setTokens(
                    response.data.accessToken,
                    response.data.refreshToken
                );
            }

            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: axiosError.response?.data?.success || false,
                requiresVerification: axiosError.response?.data?.requiresVerification,
                phone: axiosError.response?.data?.phone,
                message: axiosError.response?.data?.message || 'Login failed',
            };
        }
    },

    /**
     * Login for platform admins
     */
    adminLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        try {
            const response = await api.post<AuthResponse>('/admin/login', credentials);

            if (response.data.accessToken) {
                tokenUtils.setTokens(
                    response.data.accessToken,
                    response.data.refreshToken
                );
            }

            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                message: axiosError.response?.data?.message || 'Admin login failed',
            };
        }
    },

    /**
     * Register a new user
     */
    register: async (data: RegisterData): Promise<AuthResponse> => {
        try {
            const response = await api.post<AuthResponse>('/auth/register', data);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                message: axiosError.response?.data?.message || 'Registration failed',
            };
        }
    },

    /**
     * Get current user profile
     */
    getMe: async (): Promise<{ success: boolean; user?: User; message?: string }> => {
        try {
            const response = await api.get<{ success: boolean; user: User }>('/auth/me');
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                message: axiosError.response?.data?.message || 'Failed to get user',
            };
        }
    },

    /**
     * Logout the current user
     */
    logout: (): void => {
        tokenUtils.clearTokens();
    },

    /**
     * Check if user is authenticated (has valid token)
     */
    isAuthenticated: (): boolean => {
        return !!tokenUtils.getAccessToken();
    },

    /**
     * Send OTP to email
     */
    sendEmailOtp: async (email: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await api.post('/auth/email/send-otp', { email });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                message: axiosError.response?.data?.message || 'Failed to send OTP',
            };
        }
    },

    /**
     * Verify email OTP
     */
    verifyEmailOtp: async (email: string, code: string): Promise<AuthResponse> => {
        try {
            const response = await api.post<AuthResponse>('/auth/email/verify-otp', { email, code });

            if (response.data.accessToken) {
                tokenUtils.setTokens(
                    response.data.accessToken,
                    response.data.refreshToken
                );
            }

            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                message: axiosError.response?.data?.message || 'OTP verification failed',
            };
        }
    },

    /**
     * Send OTP to WhatsApp
     */
    sendWhatsAppOtp: async (phoneNumber: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await api.post('/auth/whatsapp/send-otp', { phoneNumber });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                message: axiosError.response?.data?.message || 'Failed to send WhatsApp OTP',
            };
        }
    },

    /**
     * Verify WhatsApp OTP
     */
    verifyWhatsAppOtp: async (phoneNumber: string, code: string): Promise<AuthResponse> => {
        try {
            const response = await api.post<AuthResponse>('/auth/whatsapp/verify-otp', { phoneNumber, code });

            if (response.data.accessToken) {
                tokenUtils.setTokens(
                    response.data.accessToken,
                    response.data.refreshToken
                );
            }

            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                message: axiosError.response?.data?.message || 'WhatsApp verification failed',
            };
        }
    },
    /**
     * Google Social Login
     */
    googleLogin: async (idToken: string, metadata?: any): Promise<AuthResponse> => {
        try {
            const response = await api.post<AuthResponse>('/auth/google', { idToken, ...metadata });

            if (response.data.accessToken) {
                tokenUtils.setTokens(
                    response.data.accessToken,
                    response.data.refreshToken
                );
            }

            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                message: axiosError.response?.data?.message || 'Google login failed',
            };
        }
    },
};

export default authService;
