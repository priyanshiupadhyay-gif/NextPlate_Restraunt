/**
 * Stitch AI Chat Controller
 * Powers the conversational AI chatbot using Gemini with full context awareness
 */

const logger = require('../utils/logger');
const geminiService = require('../services/geminiService');

// In-memory session store (keyed by userId) — per-session conversation history
const sessionStore = {};
const SESSION_MAX_TURNS = 20; // Keep last 20 turns to avoid token limits

// Stitch system persona
const STITCH_SYSTEM_PROMPT = `You are Stitch, the AI intelligence of NextPlate — a food rescue platform that connects restaurants with surplus food to NGOs and customers.

Your personality:
- You are direct, smart, and mission-driven. Think of yourself as part logistics AI, part community guardian.
- You speak in a slightly techy, confident tone — but remain warm and helpful.
- You care deeply about reducing food waste and feeding communities.
- You use subtle food rescue terminology: "rescue", "packets", "nodes" (restaurants/NGOs), "grid" (the network).

Your capabilities:
- Help restaurants list surplus food items and understand their impact (CO2 saved, meals provided)
- Help NGOs find and claim available surplus in their area
- Help customers find discounted surplus food
- Provide impact stats, insights, and recommendations
- Answer questions about scheduling pickups, pricing, carbon calculations
- Explain how the WRAP methodology works for carbon scoring

Rules:
- Keep responses concise (2-4 sentences max unless explaining something complex)
- If a user wants to "find", "search", "buy", or "add to cart" something, you should return a valid JSON action block at the end of your response.

Action JSON Format:
{
  "action": "search" | "add_to_cart" | "navigate",
  "params": {
    "query": "string",
    "itemId": "string",
    "page": "string"
  }
}

Example If user says "find pizza":
"I've initiated a grid-scan for pizza in your sector. Results incoming." { "action": "search", "params": { "query": "pizza" } }

Always encourage food rescue behaviors.`;

// Chat uses the 'chat' slot from the multi-key pool

/**
 * POST /api/chat
 * Send a message to Stitch AI and get a response
 */
exports.chat = async (req, res) => {
    const { message, sessionId } = req.body;
    const userId = req.user?.id || req.user?._id?.toString();
    const role = req.user?.role;

    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Inject user context into the first message for the session
    const sessionKey = `${userId}_${sessionId || 'default'}`;
    if (!sessionStore[sessionKey]) {
        sessionStore[sessionKey] = {
            history: [],
            createdAt: Date.now(),
            userContext: `The user is logged in as a "${role}". Their name is "${req.user.fullName || 'a user'}".`
        };
    }

    const session = sessionStore[sessionKey];

    // Trim old history to avoid token overflow
    if (session.history.length > SESSION_MAX_TURNS * 2) {
        session.history = session.history.slice(-SESSION_MAX_TURNS * 2);
    }

    const chatModel = geminiService.getChatModel();

    if (!chatModel) {
        // Fallback if no chat key is configured
        return res.json({
            success: true,
            reply: `Stitch AI core is offline. Configure GEMINI_API_KEY_CHAT in your .env to activate chat protocols.`,
            sessionId: sessionId || 'default'
        });
    }

    try {
        // Note: getChatModel() returns a base model; we start a chat with system instruction
        const model = chatModel;

        // Build history from session
        const history = session.history.map(turn => ({
            role: turn.role,
            parts: [{ text: turn.text }]
        }));

        const chat = model.startChat({ history });

        // Send message
        const result = await chat.sendMessage(message.trim());
        const rawReply = result.response.text();

        // Parse reply for JSON actions
        let reply = rawReply;
        let action = null;

        const jsonMatch = rawReply.match(/\{[\s\S]*"action"[\s\S]*\}/);
        if (jsonMatch) {
            try {
                action = JSON.parse(jsonMatch[0]);
                reply = rawReply.replace(jsonMatch[0], '').trim();
            } catch (e) {
                logger.warn('Failed to parse AI action:', e.message);
            }
        }

        // Store turn in session (text only)
        session.history.push({ role: 'user', text: message.trim() });
        session.history.push({ role: 'model', text: reply });

        logger.info(`Stitch chat: User ${userId} (${role}) — "${message.substring(0, 50)}..."`);

        res.json({
            success: true,
            reply,
            action,
            sessionId: sessionId || 'default'
        });
    } catch (error) {
        logger.error(`Stitch chat error (using fallback): ${error?.message || error?.status || 'Unknown error'}`);

        // Smart fallback when Gemini is unavailable
        const msg = message.toLowerCase();
        let fallbackReply = '';
        let fallbackAction = null;

        if (msg.includes('surplus') || msg.includes('available') || msg.includes('near') || msg.includes('food')) {
            fallbackReply = `I'm currently running in local-grid mode since my neural core is being recalibrated. Head to the Feed page to browse all available surplus in your area — you can filter by zone and category.`;
            fallbackAction = { action: 'navigate', params: { page: 'feed' } };
        } else if (msg.includes('carbon') || msg.includes('co2') || msg.includes('impact')) {
            fallbackReply = `Great question! Every meal you rescue prevents approximately 0.8kg of CO2 emissions using the WRAP UK methodology. Your total impact is tracked on your dashboard — check the Impact section for a full breakdown.`;
        } else if (msg.includes('ngo') || msg.includes('claim') || msg.includes('donate') || msg.includes('free')) {
            fallbackReply = `NGOs can claim surplus food free of charge! Browse the Feed, select items marked as donation-eligible, and complete the checkout. The restaurant will prepare it for your pickup window.`;
        } else if (msg.includes('price') || msg.includes('discount') || msg.includes('cheap')) {
            fallbackReply = `Surplus items are already discounted 30-70% off! Even better — our Adaptive Pricing system drops prices further as items approach their expiry window. Check the Feed for "Glint Window" deals.`;
            fallbackAction = { action: 'navigate', params: { page: 'feed' } };
        } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
            fallbackReply = `Hey there! I'm Stitch, your food rescue intelligence. I'm running in local mode right now, but I can still help you navigate the grid. Ask me about surplus food, your impact, or how to get started!`;
        } else if (msg.includes('order') || msg.includes('track') || msg.includes('pickup')) {
            fallbackReply = `You can track your orders from the Orders page. Each order has a QR code for pickup verification — just show it at the restaurant counter.`;
            fallbackAction = { action: 'navigate', params: { page: 'orders' } };
        } else {
            fallbackReply = `I'm operating in local-grid mode while my neural core reconnects. I can still help with basics — try asking about available surplus, your carbon impact, or how the rescue protocol works!`;
        }

        // Store fallback conversation
        session.history.push({ role: 'user', text: message.trim() });
        session.history.push({ role: 'model', text: fallbackReply });

        res.json({
            success: true,
            reply: fallbackReply,
            action: fallbackAction,
            sessionId: sessionId || 'default'
        });
    }
};

/**
 * GET /api/chat/history
 * Returns the current session history for display
 */
exports.getChatHistory = async (req, res) => {
    const userId = req.user.id;
    const sessionId = req.query.sessionId || 'default';
    const sessionKey = `${userId}_${sessionId}`;
    const session = sessionStore[sessionKey];

    res.json({
        success: true,
        history: session ? session.history : []
    });
};

/**
 * DELETE /api/chat/history
 * Clear session history
 */
exports.clearChatHistory = async (req, res) => {
    const userId = req.user.id;
    const sessionId = req.query.sessionId || 'default';
    const sessionKey = `${userId}_${sessionId}`;
    delete sessionStore[sessionKey];

    res.json({ success: true, message: 'Chat history cleared' });
};
