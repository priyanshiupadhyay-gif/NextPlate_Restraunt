import api from './api';
import { AxiosError } from 'axios';

// Types
export interface RestaurantData {
    _id: string;
    name: string;
    description?: string;
    cuisine: string[];
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        location?: {
            type: string;
            coordinates: number[];
        };
    };
    contactPhone: string;
    contactEmail?: string;
    images: string[];
    logo?: string;
    rating: number;
    totalRatings: number;
    totalOrders: number;
    isVerified: boolean;
    isActive: boolean;
    isFeatured: boolean;
    ownerId: string | { _id: string; fullName: string; email: string };
    createdAt: string;
}

interface ApiErrorResponse {
    success: boolean;
    message: string;
}

export interface OnboardRestaurantData {
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    ownerPassword: string;
    name: string;
    description?: string;
    cuisine: string[];
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        location: {
            type: string;
            coordinates: number[];
        };
    };
    contactPhone: string;
    contactEmail?: string;
}

export const adminService = {
    /**
     * List all restaurants
     */
    listRestaurants: async (params?: {
        page?: number;
        limit?: number;
        isVerified?: boolean;
        isActive?: boolean;
    }): Promise<{ success: boolean; restaurants: RestaurantData[]; total?: number; message?: string }> => {
        try {
            const response = await api.get('/admin/restaurants', { params });
            return {
                success: true,
                restaurants: response.data.restaurants || [],
                total: response.data.total,
            };
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                restaurants: [],
                message: axiosError.response?.data?.message || 'Failed to fetch restaurants',
            };
        }
    },

    /**
     * Onboard a new restaurant
     */
    onboardRestaurant: async (data: OnboardRestaurantData): Promise<{ success: boolean; restaurant?: RestaurantData; message?: string }> => {
        try {
            const response = await api.post('/admin/restaurants', data);
            return {
                success: true,
                restaurant: response.data.restaurant,
                message: response.data.message,
            };
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                message: axiosError.response?.data?.message || 'Failed to onboard restaurant',
            };
        }
    },

    /**
     * Verify/unverify a restaurant
     */
    verifyRestaurant: async (restaurantId: string, isVerified: boolean): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await api.put(`/admin/restaurants/${restaurantId}/verify`, { isVerified });
            return {
                success: true,
                message: response.data.message,
            };
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                message: axiosError.response?.data?.message || 'Failed to update verification',
            };
        }
    },

    /**
     * Get pending change requests
     */
    getChangeRequests: async (params?: {
        status?: 'pending' | 'approved' | 'rejected' | 'all';
        page?: number;
        limit?: number;
    }): Promise<{ success: boolean; requests: any[]; total?: number; message?: string }> => {
        try {
            const response = await api.get('/admin/change-requests', { params });
            return {
                success: true,
                requests: response.data.requests || [],
                total: response.data.total,
            };
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                requests: [],
                message: axiosError.response?.data?.message || 'Failed to fetch change requests',
            };
        }
    },

    /**
     * Review a change request
     */
    reviewChangeRequest: async (requestId: string, action: 'approve' | 'reject', notes?: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await api.put(`/admin/change-requests/${requestId}`, { action, notes });
            return {
                success: true,
                message: response.data.message,
            };
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                message: axiosError.response?.data?.message || 'Failed to review change request',
            };
        }
    },

    /**
     * Get platform analytics
     */
    getAnalytics: async (): Promise<{ success: boolean; analytics?: any; message?: string }> => {
        try {
            const response = await api.get('/admin/analytics');
            return {
                success: true,
                analytics: response.data.analytics,
            };
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                message: axiosError.response?.data?.message || 'Failed to fetch analytics',
            };
        }
    },

    /**
     * Get all orders (admin view)
     */
    getOrders: async (params?: {
        status?: string;
        restaurantId?: string;
        date?: string;
        page?: number;
        limit?: number;
    }): Promise<{ success: boolean; orders: any[]; total?: number; message?: string }> => {
        try {
            const response = await api.get('/admin/orders', { params });
            return {
                success: true,
                orders: response.data.orders || [],
                total: response.data.total,
            };
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                orders: [],
                message: axiosError.response?.data?.message || 'Failed to fetch orders',
            };
        }
    },

    /**
     * Get all users (filtered by role)
     */
    getUsers: async (params?: { role?: string; page?: number; limit?: number }): Promise<{ success: boolean; users: any[]; total?: number; message?: string }> => {
        try {
            const response = await api.get('/admin/users', { params });
            return {
                success: true,
                users: response.data.users || [],
                total: response.data.total,
            };
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                users: [],
                message: axiosError.response?.data?.message || 'Failed to fetch users',
            };
        }
    },

    /**
     * Verify/unverify an NGO
     */
    verifyNGO: async (ngoId: string, isVerifiedNGO: boolean): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await api.put(`/admin/ngos/${ngoId}/verify`, { isVerifiedNGO });
            return {
                success: true,
                message: response.data.message,
            };
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                message: axiosError.response?.data?.message || 'Failed to verify NGO',
            };
        }
    },
};

export default adminService;
