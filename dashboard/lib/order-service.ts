import api from './api';
import { Order } from './restaurant-service';

export const orderService = {
    /**
     * Get user's own orders (as a customer/rescuer)
     */
    getUserOrders: async (params?: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{ success: boolean; orders: Order[]; message?: string }> => {
        try {
            const response = await api.get('/orders', {
                params,
            });
            return {
                success: true,
                orders: response.data.orders || response.data.data || [],
            };
        } catch (error: any) {
            return {
                success: false,
                orders: [],
                message: error.response?.data?.message || 'Failed to fetch your orders',
            };
        }
    },

    /**
     * Get a specific order by ID
     */
    getOrderById: async (orderId: string): Promise<{ success: boolean; order?: Order; message?: string }> => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            return {
                success: true,
                order: response.data.order || response.data.data,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch order details',
            };
        }
    }
};

export default orderService;
