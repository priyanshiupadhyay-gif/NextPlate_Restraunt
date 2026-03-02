import api from './api';

export interface RescueStrategy {
    aiPowered: boolean;
    model?: string;
    title: string;
    priority: string;
    timestamp: string;
    itemsAnalyzed: number;
    recipeSuggestions: Array<{
        name: string;
        description: string;
        ingredients: string[];
        steps: string[];
        servings: number;
        nutritionEstimate: {
            calories: number;
            protein: string;
            carbs: string;
            fat: string;
        };
        prepTimeMinutes: number;
    }>;
    distributionPlan: {
        recommendedNGOs: string;
        packagingAdvice: string;
        shelfLife: string;
        transportNotes: string;
    };
    impactEstimate: {
        mealsCreated: number;
        carbonSavedKg: number;
        waterSavedLiters: number;
        wastePreventedKg: number;
    };
    urgencyNote: string;
}

export interface MealPlan {
    aiPowered: boolean;
    mealPlan?: {
        totalServings: number;
        meals: Array<{
            name: string;
            servings: number;
            itemsUsed: string[];
            instructions: string;
            nutritionPerServing: {
                calories: number;
                protein: string;
            };
        }>;
    };
    packagingGuide?: string;
    safetyNotes?: string;
    estimatedFeedCount?: number;
    donationItems?: Array<{
        id: string;
        name: string;
        quantity: number;
        category: string;
        restaurant: string;
        expiryTime: string;
    }>;
}

export const aiService = {
    /**
     * Get AI rescue strategy for expiring items
     */
    getRescueStrategy: async (): Promise<{ success: boolean; data?: RescueStrategy; message?: string }> => {
        try {
            const response = await api.get('/ai/rescue-strategy');
            return {
                success: true,
                data: response.data.data,
                message: response.data.message,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch rescue strategy',
            };
        }
    },

    /**
     * Get AI meal plan for donation items
     */
    getMealPlan: async (): Promise<{ success: boolean; data?: MealPlan; message?: string }> => {
        try {
            const response = await api.post('/ai/meal-plan');
            return {
                success: true,
                data: response.data.data,
                message: response.data.message,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to generate meal plan',
            };
        }
    },

    /**
     * Check AI system status
     */
    getStatus: async (): Promise<{ success: boolean; aiConfigured: boolean; model: string }> => {
        try {
            const response = await api.get('/ai/status');
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                aiConfigured: false,
                model: 'offline',
            };
        }
    },
};

export default aiService;
