import api from './api';

// Types
export interface MenuItem {
    _id: string;
    name: string;
    description: string;
    category: string;
    originalPrice: number;
    discountedPrice: number;
    availableQuantity: number;
    isAvailable: boolean;
    expiryTime?: string;
    imageUrl?: string;
}

export interface OrderItem {
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    itemTotal: number;
}

export interface Order {
    _id: string;
    orderNumber: string;
    customerId: {
        _id: string;
        fullName: string;
        phoneNumber?: string;
    } | string;
    restaurantId: string;
    items: OrderItem[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paymentStatus: string;
    orderStatus: 'placed' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    pickupTimeSlot?: {
        startTime: string;
        endTime: string;
        date: Date;
    };
    specialInstructions?: string;
    createdAt: string;
    statusHistory: Array<{
        status: string;
        timestamp: string;
        note?: string;
    }>;
}

export interface DashboardStats {
    todayOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    activeMenuItems: number;
    rating: number;
    totalRatings: number;
}

// Restaurant Service
export const restaurantService = {
    /**
     * Get restaurant's orders
     */
    getOrders: async (params?: {
        status?: string;
        page?: number;
        limit?: number;
        date?: string;
    }): Promise<{ success: boolean; orders: Order[]; total?: number; message?: string }> => {
        try {
            const response = await api.get('/restaurant/orders', {
                params,
            });
            return {
                success: true,
                orders: response.data.orders || [],
                total: response.data.total,
            };
        } catch (error: any) {
            return {
                success: false,
                orders: [],
                message: error.response?.data?.message || 'Failed to fetch orders',
            };
        }
    },

    /**
     * Update order status
     */
    updateOrderStatus: async (
        orderId: string,
        status: string,
        note?: string
    ): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await api.put(`/restaurant/orders/${orderId}/status`, {
                status,
                note,
            });
            return {
                success: true,
                message: response.data.message,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update order status',
            };
        }
    },

    /**
     * Get dashboard statistics
     */
    getStats: async (): Promise<{ success: boolean; stats?: DashboardStats; message?: string }> => {
        try {
            const response = await api.get('/restaurant/stats');
            return {
                success: true,
                stats: response.data.stats,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch stats',
            };
        }
    },

    /**
     * Get restaurant's menu items
     */
    getMenuItems: async (params?: {
        category?: string;
        isAvailable?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{ success: boolean; items: MenuItem[]; total?: number; message?: string }> => {
        try {
            const response = await api.get('/restaurant/menu', {
                params,
            });
            return {
                success: true,
                items: response.data.items || [],
                total: response.data.total,
            };
        } catch (error: any) {
            return {
                success: false,
                items: [],
                message: error.response?.data?.message || 'Failed to fetch menu items',
            };
        }
    },

    /**
     * Update menu item
     */
    updateMenuItem: async (
        itemId: string,
        data: Partial<MenuItem>
    ): Promise<{ success: boolean; item?: MenuItem; message?: string }> => {
        try {
            const response = await api.put(`/restaurant/menu/${itemId}`, data);
            return {
                success: true,
                item: response.data.item,
                message: response.data.message,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update menu item',
            };
        }
    },

    /**
     * Toggle menu item availability
     */
    toggleAvailability: async (
        itemId: string,
        isAvailable: boolean,
        availableQuantity?: number
    ): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await api.put(`/restaurant/menu/${itemId}/availability`, {
                isAvailable,
                availableQuantity,
            });
            return {
                success: true,
                message: response.data.message,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to toggle availability',
            };
        }
    },

    /**
     * Create fresh menu item
     */
    addMenuItem: async (data: any): Promise<{ success: boolean; item?: MenuItem; message?: string }> => {
        try {
            const response = await api.post('/restaurant/menu', data);
            return {
                success: true,
                item: response.data.item,
                message: response.data.message,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to add menu item',
            };
        }
    },

    /**
     * Verify pickup QR code
     */
    verifyQR: async (qrData: string): Promise<{ success: boolean; order?: any; message?: string }> => {
        try {
            const response = await api.post('/restaurant/orders/verify-qr', { qrData });
            return {
                success: true,
                order: response.data.order,
                message: response.data.message,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to verify QR code',
            };
        }
    },

    /**
     * Mark menu item for NGO donation
     */
    markForDonation: async (itemId: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await api.put(`/restaurant/menu/${itemId}/donate`);
            return {
                success: true,
                message: response.data.message,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to mark for donation',
            };
        }
    },

    /**
     * Remove item from donation pool
     */
    unmarkDonation: async (itemId: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await api.put(`/restaurant/menu/${itemId}/undonate`);
            return {
                success: true,
                message: response.data.message,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to unmark donation',
            };
        }
    },
};

export default restaurantService;
