/**
 * Recipe Alchemist Controller
 * Uses Gemini to synthesize recipes from claimed food items
 */

const geminiService = require('../services/geminiService');
const logger = require('../utils/logger');

/**
 * @desc    Generate a recipe from a list of claimed food items
 * @route   POST /api/v1/recipe-alchemist/synthesize
 * @access  Private (NGO)
 */
exports.synthesizeRecipe = async (req, res) => {
    try {
        const { items, servings = 50, dietaryPreference = 'any' } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one food item is required' });
        }

        const itemsList = items.map(i => `${i.quantity || 1}x ${i.name}`).join(', ');

        const prompt = `You are NextPlate's Recipe Alchemist — an AI chef that helps NGO community kitchens transform donated surplus food into nutritious meals.

Available donated ingredients: ${itemsList}
Target servings: ${servings}
Dietary preference: ${dietaryPreference}

Create ONE practical, nutritious recipe that uses ALL or MOST of the available ingredients. This is for a community kitchen feeding ${servings} people.

Return ONLY valid JSON:
{
  "recipeName": "Creative recipe name",
  "description": "A warm, inviting 1-2 sentence description",
  "prepTime": "e.g. 45 minutes",
  "cookTime": "e.g. 1 hour",
  "servings": ${servings},
  "difficulty": "Easy" | "Medium" | "Hard",
  "ingredients": [
    { "item": "ingredient name", "quantity": "amount with unit", "fromDonation": true/false }
  ],
  "steps": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "nutritionPerServing": {
    "calories": number,
    "protein": "Xg",
    "carbs": "Xg",
    "fat": "Xg"
  },
  "chefTips": ["practical tip 1", "practical tip 2"],
  "wasteReduction": "How this recipe maximizes use of all donated items"
}`;

        if (!geminiService.isConfigured('vision')) {
            return res.status(200).json({
                success: true,
                data: {
                    recipeName: 'Community Surplus Stew',
                    description: 'A hearty, nutritious stew made from all your donated ingredients — comfort food for the community.',
                    prepTime: '30 minutes',
                    cookTime: '1 hour',
                    servings,
                    difficulty: 'Easy',
                    ingredients: items.map(i => ({ item: i.name, quantity: `${i.quantity || 1} units`, fromDonation: true })),
                    steps: ['Prep all donated ingredients.', 'Combine in large pots.', 'Cook on medium heat until tender.', 'Season to taste.', 'Serve warm to community.'],
                    nutritionPerServing: { calories: 350, protein: '15g', carbs: '45g', fat: '10g' },
                    chefTips: ['Season progressively while cooking.', 'Add donated bread on the side for additional calories.'],
                    wasteReduction: 'This recipe uses 100% of donated items, ensuring zero secondary waste.'
                }
            });
        }

        const responseText = await geminiService.generateContent(prompt, 'vision');
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const recipe = JSON.parse(jsonMatch[0]);
            return res.status(200).json({
                success: true,
                data: recipe
            });
        }

        throw new Error('Recipe synthesis failed');

    } catch (error) {
        logger.error('Recipe Alchemist error:', error.message || error);
        // Graceful fallback — always return a recipe
        const { items, servings = 50 } = req.body;
        res.status(200).json({
            success: true,
            data: {
                recipeName: 'Community Surplus Stew',
                description: 'A hearty, nutritious stew made from all your donated ingredients — comfort food for the community.',
                prepTime: '30 minutes',
                cookTime: '1 hour',
                servings,
                difficulty: 'Easy',
                ingredients: (items || []).map(i => ({ item: i.name, quantity: `${i.quantity || 1} units`, fromDonation: true })),
                steps: ['Prep all donated ingredients.', 'Combine in large pots.', 'Cook on medium heat until tender.', 'Season to taste.', 'Serve warm to community.'],
                nutritionPerServing: { calories: 350, protein: '15g', carbs: '45g', fat: '10g' },
                chefTips: ['Season progressively while cooking.', 'Add donated bread on the side for additional calories.'],
                wasteReduction: 'This recipe uses 100% of donated items, ensuring zero secondary waste.',
                aiFallback: true
            }
        });
    }
};

/**
 * @desc    Get recipe suggestions for specific categories
 * @route   GET /api/v1/recipe-alchemist/suggestions
 * @access  Private
 */
exports.getSuggestions = async (req, res) => {
    try {
        const { category = 'mixed' } = req.query;

        const suggestions = {
            mixed: [
                { name: 'Community Biryani', description: 'Rice + protein + vegetables combined into a traditional one-pot meal', difficulty: 'Medium', feeds: '50+' },
                { name: 'Hearty Vegetable Curry', description: 'All vegetables combined with spices for a nutritious curry', difficulty: 'Easy', feeds: '40+' },
                { name: 'Rescue Fried Rice', description: 'Quick high-calorie meal using rice and any available add-ins', difficulty: 'Easy', feeds: '60+' }
            ],
            bakery: [
                { name: 'Bread Pudding for 50', description: 'Transform surplus bread into a warm dessert', difficulty: 'Easy', feeds: '50+' },
                { name: 'Community Sandwiches', description: 'Quick assembly line sandwiches from bread and fillings', difficulty: 'Easy', feeds: '30+' }
            ],
            produce: [
                { name: 'Garden Harvest Soup', description: 'All vegetables blended into a thick nutritious soup', difficulty: 'Easy', feeds: '40+' },
                { name: 'Stir-Fry Medley', description: 'Quick high-heat cooking preserves nutrients', difficulty: 'Easy', feeds: '35+' }
            ]
        };

        res.status(200).json({
            success: true,
            data: suggestions[category] || suggestions.mixed
        });
    } catch (error) {
        logger.error('Recipe suggestions error:', error);
        res.status(500).json({ success: false, message: 'Failed to load recipe suggestions' });
    }
};
