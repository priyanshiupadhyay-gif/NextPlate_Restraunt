/**
 * Gemini AI Service — Multi-Key Pool Architecture
 * Distributes AI workload across multiple API keys to avoid rate limits
 * 
 * Key Pool:
 *   GEMINI_API_KEY_CHAT      → Stitch Chat conversations
 *   GEMINI_API_KEY_ANALYTICS → Recommendations, Reports, Daily Summaries
 *   GEMINI_API_KEY_VISION    → Image analysis, Recipe Alchemist, Route Optimizer
 *   GEMINI_API_KEY           → Legacy fallback (used when task-specific key is missing)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════════════
//  MULTI-KEY POOL INITIALIZATION
// ═══════════════════════════════════════════════════════════════

const KEY_SLOTS = {
    chat: process.env.GEMINI_API_KEY_CHAT,
    analytics: process.env.GEMINI_API_KEY_ANALYTICS,
    vision: process.env.GEMINI_API_KEY_VISION,
    fallback: process.env.GEMINI_API_KEY,
};

// Resolve: task-specific key → fallback key → null
const resolveKey = (slot) => {
    const key = KEY_SLOTS[slot];
    if (key && key !== 'YOUR_GEMINI_KEY_1_HERE' && key !== 'YOUR_GEMINI_KEY_2_HERE' && key !== 'YOUR_GEMINI_KEY_3_HERE' && key !== 'your_gemini_api_key_here') {
        return key;
    }
    // Fall back to legacy key
    const fb = KEY_SLOTS.fallback;
    if (fb && fb !== 'your_gemini_api_key_here') return fb;
    return null;
};

// Model cache — one per resolved key to avoid duplicating instances
const modelCache = {};

const getModel = (slot, modelName = 'gemini-2.0-flash') => {
    const apiKey = resolveKey(slot);
    if (!apiKey) return null;

    const cacheKey = `${apiKey}_${modelName}`;
    if (!modelCache[cacheKey]) {
        const genAI = new GoogleGenerativeAI(apiKey);
        modelCache[cacheKey] = genAI.getGenerativeModel({ model: modelName });
    }
    return modelCache[cacheKey];
};

// Log which keys are configured
const configuredSlots = [];
if (resolveKey('chat')) configuredSlots.push('Chat');
if (resolveKey('analytics')) configuredSlots.push('Analytics');
if (resolveKey('vision')) configuredSlots.push('Vision');

if (configuredSlots.length > 0) {
    const uniqueKeys = new Set([resolveKey('chat'), resolveKey('analytics'), resolveKey('vision')].filter(Boolean));
    logger.info(`✅ Gemini AI Pool: ${uniqueKeys.size} unique key(s) across ${configuredSlots.length} slots [${configuredSlots.join(', ')}]`);
} else {
    logger.warn('⚠️ No Gemini API keys configured. AI features will use fallback logic.');
}

// ═══════════════════════════════════════════════════════════════
//  SLOT-AWARE API METHODS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a specific slot (or any slot) is configured
 * @param {string} [slot] - 'chat', 'analytics', 'vision'. Omit to check any.
 */
exports.isConfigured = (slot) => {
    if (slot) return !!getModel(slot);
    return !!getModel('chat') || !!getModel('analytics') || !!getModel('vision');
};

// Model fallback chain — try primary, then lite if quota exceeded
const MODEL_CHAIN = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

/**
 * Try generating content with automatic model fallback on 429 errors
 */
const generateWithRetry = async (slot, promptOrParts, maxRetries = 2) => {
    for (const modelName of MODEL_CHAIN) {
        const model = getModel(slot, modelName);
        if (!model) continue;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await model.generateContent(promptOrParts);
                return result;
            } catch (error) {
                const is429 = error?.message?.includes('429') || error?.message?.includes('quota');

                if (is429 && attempt < maxRetries - 1) {
                    // Wait before retrying (exponential backoff: 2s, 4s)
                    const delay = Math.pow(2, attempt + 1) * 1000;
                    logger.warn(`Gemini rate limited (${modelName}), retrying in ${delay / 1000}s...`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }

                if (is429) {
                    // Try next model in chain
                    logger.warn(`Quota exhausted for ${modelName}, trying fallback model...`);
                    break;
                }

                // Non-429 error — throw immediately
                throw error;
            }
        }
    }
    throw new Error('All Gemini models exhausted (quota exceeded on all fallbacks)');
};

/**
 * Generic text generation — routes to the specified slot with retry
 * @param {string} prompt
 * @param {string} [slot='analytics'] - Which key pool to use
 */
exports.generateContent = async (prompt, slot = 'analytics') => {
    if (!getModel(slot)) throw new Error(`Gemini AI not configured for slot: ${slot}`);
    const result = await generateWithRetry(slot, prompt);
    return result.response.text();
};

/**
 * Stitch Chat — uses the 'chat' key slot
 * Returns a Gemini model pre-configured for chat conversations
 * Tries primary model first, falls back to lite if needed
 */
exports.getChatModel = () => {
    for (const modelName of MODEL_CHAIN) {
        const model = getModel('chat', modelName);
        if (model) return model;
    }
    return null;
};

/**
 * Generate a rescue strategy from expiring items
 * Uses: analytics slot
 */
exports.generateRescueStrategy = async (items) => {
    const model = getModel('analytics');
    if (!model) return exports.fallbackStrategy(items);

    try {
        const itemsList = items.map(item =>
            `- ${item.availableQuantity}x "${item.name}" (${item.category}, from ${item.restaurantId?.name || 'Unknown'}, expires in ${Math.round((new Date(item.expiryTime) - Date.now()) / (1000 * 60))} mins)`
        ).join('\n');

        const prompt = `You are NextPlate's AI rescue strategist. We have surplus food items that are about to expire and need to be rescued to prevent waste.

Here are the expiring items:
${itemsList}

Generate a JSON response with a community rescue strategy. The JSON should have these exact fields:
{
  "title": "A creative strategy title",
  "priority": "URGENT" or "HIGH" or "MODERATE",
  "recipeSuggestions": [
    {
      "name": "Recipe name",
      "description": "How to combine these surplus items into a nutritious meal",
      "ingredients": ["ingredient1", "ingredient2"],
      "steps": ["step1", "step2", "step3"],
      "servings": number,
      "nutritionEstimate": { "calories": number, "protein": "Xg", "carbs": "Xg", "fat": "Xg" },
      "prepTimeMinutes": number
    }
  ],
  "distributionPlan": {
    "recommendedNGOs": "Description of which types of NGOs should be contacted",
    "packagingAdvice": "How to package for distribution",
    "shelfLife": "Estimated remaining safe consumption window",
    "transportNotes": "Temperature and transport requirements"
  },
  "impactEstimate": {
    "mealsCreated": number,
    "carbonSavedKg": number,
    "waterSavedLiters": number,
    "wastePreventedKg": number
  },
  "urgencyNote": "A short note about why speed matters for these specific items"
}

Be practical, creative, and focus on maximizing nutritional value. Only return valid JSON, no markdown formatting.`;

        const result = await generateWithRetry('analytics', prompt);
        const responseText = result.response.text();

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const strategy = JSON.parse(jsonMatch[0]);
            strategy.aiPowered = true;
            strategy.model = 'gemini-2.0-flash';
            strategy.keySlot = 'analytics';
            strategy.timestamp = new Date();
            strategy.itemsAnalyzed = items.length;
            return strategy;
        }

        logger.warn('Gemini response was not valid JSON, using fallback');
        return exports.fallbackStrategy(items);

    } catch (error) {
        logger.error('Gemini AI error (analytics slot):', error.message);
        return exports.fallbackStrategy(items);
    }
};

/**
 * Generate a meal plan for NGO distribution
 * Uses: analytics slot
 */
exports.generateMealPlan = async (donationItems) => {
    const model = getModel('analytics');
    if (!model) {
        return {
            aiPowered: false,
            plan: 'AI not configured. Please set GEMINI_API_KEY_ANALYTICS in your .env file.',
            items: donationItems.map(i => ({ name: i.name, quantity: i.availableQuantity }))
        };
    }

    try {
        const itemsList = donationItems.map(item =>
            `- ${item.availableQuantity}x "${item.name}" (${item.category})`
        ).join('\n');

        const prompt = `You are NextPlate's community nutrition planner. These food items have been marked for donation to NGOs:

${itemsList}

Create a practical community meal plan in JSON format:
{
  "mealPlan": {
    "totalServings": number,
    "meals": [
      {
        "name": "Meal name",
        "servings": number,
        "itemsUsed": ["item1", "item2"],
        "instructions": "Brief cooking/assembly instructions",
        "nutritionPerServing": { "calories": number, "protein": "Xg" }
      }
    ]
  },
  "packagingGuide": "How to package for safe transport",
  "safetyNotes": "Food safety reminders",
  "estimatedFeedCount": number
}

Only return valid JSON.`;

        const result = await generateWithRetry('analytics', prompt);
        const responseText = result.response.text();

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const plan = JSON.parse(jsonMatch[0]);
            plan.aiPowered = true;
            plan.keySlot = 'analytics';
            plan.timestamp = new Date();
            return plan;
        }

        return { aiPowered: false, error: 'Could not parse AI response' };
    } catch (error) {
        logger.error('Gemini meal plan error (analytics slot):', error.message);
        return { aiPowered: false, error: error.message };
    }
};

/**
 * Analyze a food image using Stitch Vision
 * Uses: vision slot
 */
exports.analyzeImage = async (imageBuffer, mimeType, customPrompt) => {
    const model = getModel('vision');
    if (!model) throw new Error('Gemini Vision not configured. Set GEMINI_API_KEY_VISION.');

    try {
        const defaultPrompt = `You are NextPlate's "Stitch Vision" AI. Analyze this food image and provide details for a restaurant surplus listing.
        
        Identify the food and provide:
        1. A catchy name
        2. A mouth-watering description (max 200 chars)
        3. The most likely category (mains, appetizers, desserts, beverages, breads, rice, combos, snacks, bakery)
        4. Whether it is Vegetarian (true/false)
        5. Common allergens (nuts, dairy, eggs, soy, wheat, shellfish, fish)
        6. A suggested rescue price (discounted) in USD
        7. Typical carbon saving for this portion (kg CO2)
        
        Return ONLY valid JSON:
        {
          "name": "string",
          "description": "string",
          "category": "string",
          "isVegetarian": boolean,
          "allergens": ["string"],
          "suggestedPrice": number,
          "carbonScore": number
        }`;

        const prompt = customPrompt || defaultPrompt;

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType
            }
        };

        const result = await generateWithRetry('vision', [prompt, imagePart]);
        const responseText = result.response.text();

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error('AI response was not valid data');
    } catch (error) {
        logger.error('Stitch Vision error (vision slot):', error.message);
        throw error;
    }
};

/**
 * Fallback strategy when Gemini is not available
 */
exports.fallbackStrategy = (items) => {
    const itemsList = items.map(item => `${item.availableQuantity}x ${item.name}`).join(', ');
    const categories = items.map(i => i.category);
    const totalQuantity = items.reduce((acc, item) => acc + item.availableQuantity, 0);
    const totalCarbon = items.reduce((acc, item) => acc + (item.carbonScore || 0.8) * item.availableQuantity, 0);

    return {
        aiPowered: false,
        title: 'Community Resilience Protocol: Active Rescue',
        priority: 'URGENT',
        timestamp: new Date(),
        itemsAnalyzed: items.length,
        recipeSuggestions: [{
            name: categories.includes('bakery') || categories.includes('breads')
                ? 'Zero-Waste Savory Bread Pudding'
                : 'Neighborhood Community Stew',
            description: `A high-density nutritional bridge using current surplus: ${itemsList}.`,
            ingredients: items.map(i => i.name),
            steps: [
                'Gather all surplus items and sort by category.',
                'Prep: Wash and dice all produce, blanch vegetables.',
                'Combine proteins and carbs into a unified base.',
                'Cook in community-size batches at safe temperatures.',
                'Package in individual portions for distribution.'
            ],
            servings: Math.floor(totalQuantity * 1.5),
            nutritionEstimate: { calories: 350, protein: '15g', carbs: '45g', fat: '12g' },
            prepTimeMinutes: 45
        }],
        distributionPlan: {
            recommendedNGOs: 'Contact local shelters and community kitchens within 5km radius.',
            packagingAdvice: 'Use food-safe containers. Label with date and contents.',
            shelfLife: 'Consume within 4-6 hours of preparation.',
            transportNotes: 'Maintain temperature below 5°C for cold items, above 60°C for hot.'
        },
        impactEstimate: {
            mealsCreated: Math.floor(totalQuantity * 1.5),
            carbonSavedKg: parseFloat(totalCarbon.toFixed(1)),
            waterSavedLiters: Math.round(totalQuantity * 400),
            wastePreventedKg: parseFloat((totalQuantity * 0.4).toFixed(1))
        },
        urgencyNote: `${items.length} items expiring soon. Immediate action required to prevent ${(totalQuantity * 0.4).toFixed(1)}kg of food waste.`
    };
};
