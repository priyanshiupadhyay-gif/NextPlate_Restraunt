import api from './api';

export interface ImpactStats {
    totalMealsRescued: number;
    totalCO2Saved: string;
    totalMoneySaved: string;
    networkResilience: {
        activeNGOs: number;
        participatingRestaurants: number;
    };
    timestamp: string;
}

export const impactService = {
    getGlobalImpact: async (): Promise<{ success: boolean; data?: ImpactStats; message?: string }> => {
        try {
            const response = await api.get('/impact/stats');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch impact statistics'
            };
        }
    },

    getDonations: async (): Promise<{ success: boolean; data?: any[]; message?: string }> => {
        try {
            const response = await api.get('/impact/donations');
            return {
                success: true,
                data: response.data.data
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch donations'
            };
        }
    }
};
