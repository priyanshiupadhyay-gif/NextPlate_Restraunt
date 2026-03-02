/**
 * AI-Powered Smart Recommendations Controller
 * Uses Gemini to analyze user's order history, preferences, and available items
 * to generate personalized food rescue recommendations.
 */

const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const logger = require('../utils/logger');
const geminiService = require('../services/geminiService');

/**
 * GET /api/v1/recommendations
 * Returns AI-curated personalized food recommendations for the authenticated user
 */
exports.getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 6;

        // 1. Fetch user's recent order history (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentOrders = await Order.find({
            customerId: userId,
            createdAt: { $gte: thirtyDaysAgo },
            orderStatus: { $in: ['completed', 'ready', 'preparing', 'confirmed'] }
        })
            .sort({ createdAt: -1 })
            .limit(15)
            .populate('restaurantId', 'name cuisine address');

        // 2. Extract user preferences from order history
        const orderCategories = {};
        const orderedItemNames = [];
        const priceRange = { min: Infinity, max: 0 };
        const favRestaurants = {};
        let totalOrders = recentOrders.length;
        let isVegPreference = 0;
        let totalItems = 0;

        recentOrders.forEach(order => {
            const restName = order.restaurantId?.name || 'Unknown';
            favRestaurants[restName] = (favRestaurants[restName] || 0) + 1;

            order.items.forEach(item => {
                totalItems++;
                orderedItemNames.push(item.name);
                if (item.unitPrice < priceRange.min) priceRange.min = item.unitPrice;
                if (item.unitPrice > priceRange.max) priceRange.max = item.unitPrice;
            });
        });

        // 3. Fetch currently available menu items
        const availableItems = await MenuItem.find({
            isAvailable: true,
            isApproved: true,
            availableQuantity: { $gt: 0 }
        })
            .populate('restaurantId', 'name cuisine address rating')
            .sort({ createdAt: -1 })
            .limit(50);

        if (availableItems.length === 0) {
            return res.status(200).json({
                success: true,
                recommendations: [],
                aiInsight: 'No surplus items available right now. Check back soon!',
                source: 'empty'
            });
        }

        // 4. Build the AI prompt
        const userProfile = totalOrders > 0 ? `
USER PROFILE:
- Past orders: ${totalOrders} orders in the last 30 days
- Frequently ordered items: ${orderedItemNames.slice(0, 10).join(', ')}
- Favorite restaurants: ${Object.entries(favRestaurants).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => `${name} (${count}x)`).join(', ')}
- Price range: $${priceRange.min === Infinity ? 0 : priceRange.min} - $${priceRange.max}
` : `USER PROFILE: New user with no order history. Recommend popular and high-value items.`;

        const itemList = availableItems.map((item, i) =>
            `${i + 1}. "${item.name}" | $${item.discountedPrice} (was $${item.originalPrice}) | ${item.category} | from ${item.restaurantId?.name || 'Unknown'} | ${item.availableQuantity} left | ${item.isVegetarian ? 'Veg' : 'Non-Veg'} | Carbon: ${item.carbonScore}kg`
        ).join('\n');

        // 5. Call Gemini for smart recommendations
        let aiRecommendations = [];
        let aiInsight = '';

        if (geminiService.isConfigured('analytics')) {
            try {
                const prompt = `You are NextPlate's recommendation AI. Analyze the user's profile and available surplus food items to suggest personalized recommendations.

${userProfile}

AVAILABLE SURPLUS ITEMS:
${itemList}

INSTRUCTIONS:
- Pick the ${limit} best items for this user based on their preferences, value, and urgency.
- For each item, provide a short personalized reason why this matches the user.
- Also write a 1-line overall insight about the user's food rescue style.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "insight": "One line about how this user rescues food",
  "recommendations": [
    {
      "index": 1,
      "reason": "Short personalized reason (max 15 words)"
    }
  ]
}`;

                const result = await geminiService.generateContent(prompt, 'analytics');
                const text = result.trim()
                    .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

                const parsed = JSON.parse(text);
                aiInsight = parsed.insight || '';

                if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
                    aiRecommendations = parsed.recommendations
                        .filter(r => r.index >= 1 && r.index <= availableItems.length)
                        .slice(0, limit);
                }
            } catch (aiError) {
                logger.warn('AI recommendation generation failed, using fallback:', aiError.message);
            }
        }

        // 6. Build final response
        let finalItems;

        if (aiRecommendations.length > 0) {
            // Use AI-selected items with reasons
            finalItems = aiRecommendations.map(rec => {
                const item = availableItems[rec.index - 1];
                if (!item) return null;
                return {
                    _id: item._id,
                    name: item.name,
                    description: item.description,
                    category: item.category,
                    originalPrice: item.originalPrice,
                    discountedPrice: item.discountedPrice,
                    discountPercentage: item.discountPercentage,
                    images: item.images,
                    isVegetarian: item.isVegetarian,
                    isVegan: item.isVegan,
                    availableQuantity: item.availableQuantity,
                    carbonScore: item.carbonScore,
                    restaurantName: item.restaurantId?.name || 'Unknown',
                    restaurantRating: item.restaurantId?.rating || 0,
                    aiReason: rec.reason,
                    expiryTime: item.expiryTime
                };
            }).filter(Boolean);
        } else {
            // Fallback: sort by discount percentage and carbon score
            finalItems = availableItems
                .sort((a, b) => (b.discountPercentage + b.carbonScore * 10) - (a.discountPercentage + a.carbonScore * 10))
                .slice(0, limit)
                .map(item => ({
                    _id: item._id,
                    name: item.name,
                    description: item.description,
                    category: item.category,
                    originalPrice: item.originalPrice,
                    discountedPrice: item.discountedPrice,
                    discountPercentage: item.discountPercentage,
                    images: item.images,
                    isVegetarian: item.isVegetarian,
                    isVegan: item.isVegan,
                    availableQuantity: item.availableQuantity,
                    carbonScore: item.carbonScore,
                    restaurantName: item.restaurantId?.name || 'Unknown',
                    restaurantRating: item.restaurantId?.rating || 0,
                    aiReason: 'High impact rescue opportunity',
                    expiryTime: item.expiryTime
                }));
            aiInsight = 'Showing top surplus items by impact and value.';
        }

        res.status(200).json({
            success: true,
            recommendations: finalItems,
            aiInsight,
            totalAvailable: availableItems.length,
            source: aiRecommendations.length > 0 ? 'gemini' : 'fallback'
        });

    } catch (error) {
        logger.error('Recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate recommendations'
        });
    }
};
