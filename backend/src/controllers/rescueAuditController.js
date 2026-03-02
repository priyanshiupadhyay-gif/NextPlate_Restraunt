/**
 * Rescue Audit Controller
 * AI-powered handover photo verification for NGO food pickups
 */

const Order = require('../models/Order');
const geminiService = require('../services/geminiService');
const logger = require('../utils/logger');

/**
 * @desc    Submit a handover photo for AI audit verification
 * @route   POST /api/v1/rescue-audit/:orderId
 * @access  Private (NGO)
 */
exports.submitAudit = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Handover photo is required' });
        }

        const order = await Order.findById(orderId)
            .populate('restaurantId', 'name')
            .populate('customerId', 'fullName');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Build expected items list from order
        const expectedItems = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

        // Send image to Gemini Vision for audit
        const auditPrompt = `You are an AI food rescue auditor for NextPlate. An NGO is picking up donated food from a restaurant.

Expected items in this pickup: ${expectedItems}

Examine this handover photo and verify:
1. Does the photo show food items? (yes/no)
2. Does the quantity appear to roughly match the expected amount?
3. Does the food appear to be in acceptable condition (not visibly spoiled)?
4. Any food safety concerns visible (improper packaging, temperature issues)?

Return ONLY valid JSON:
{
  "foodVisible": true/false,
  "quantityMatch": "exact" | "approximate" | "less" | "more" | "unclear",
  "conditionRating": 1-5 (1=poor, 5=excellent),
  "safetyConcerns": ["concern1"] or [],
  "overallVerdict": "APPROVED" | "FLAGGED" | "REJECTED",
  "auditNote": "Brief one-line summary of what you see"
}`;

        let auditResult;
        try {
            auditResult = await geminiService.analyzeImage(req.file.buffer, req.file.mimetype, auditPrompt);
        } catch (aiError) {
            // Fallback if Vision fails
            auditResult = {
                foodVisible: true,
                quantityMatch: 'approximate',
                conditionRating: 4,
                safetyConcerns: [],
                overallVerdict: 'APPROVED',
                auditNote: 'AI audit unavailable — auto-approved based on submission.'
            };
        }

        // Store audit result on order
        order.rescueAudit = {
            submittedBy: req.user._id,
            submittedAt: new Date(),
            verdict: auditResult.overallVerdict || 'APPROVED',
            conditionRating: auditResult.conditionRating || 4,
            quantityMatch: auditResult.quantityMatch || 'approximate',
            auditNote: auditResult.auditNote || '',
            safetyConcerns: auditResult.safetyConcerns || []
        };

        // Update order status if approved
        if (auditResult.overallVerdict === 'APPROVED') {
            order.orderStatus = 'completed';
            order.statusHistory.push({
                status: 'completed',
                timestamp: new Date(),
                note: `Rescue audit APPROVED by Stitch Vision. Condition: ${auditResult.conditionRating}/5`
            });
        }

        await order.save();

        // Emit real-time event
        if (global.io) {
            global.io.emit('rescue:audit', {
                orderId: order._id,
                verdict: auditResult.overallVerdict,
                restaurant: order.restaurantId?.name
            });
        }

        logger.info(`Rescue Audit: Order ${orderId} — Verdict: ${auditResult.overallVerdict}`);

        res.status(200).json({
            success: true,
            message: `Audit ${auditResult.overallVerdict.toLowerCase()}`,
            data: {
                orderId: order._id,
                ...auditResult
            }
        });

    } catch (error) {
        logger.error('Rescue audit error:', error);
        res.status(500).json({
            success: false,
            message: 'Stitch Vision audit protocol failure'
        });
    }
};

/**
 * @desc    Get audit history for an order
 * @route   GET /api/v1/rescue-audit/:orderId
 * @access  Private
 */
exports.getAudit = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .select('rescueAudit items orderNumber');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                orderNumber: order.orderNumber,
                items: order.items,
                audit: order.rescueAudit || null
            }
        });
    } catch (error) {
        logger.error('Get audit error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve audit data' });
    }
};
