const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const logger = require('../utils/logger');
const geminiService = require('../services/geminiService');

/**
 * NGO Rescue Route Optimizer
 * Uses Gemini to sequence the most carbon-efficient pickup route
 */
exports.getRescueRoute = async (req, res) => {
    try {
        const { currentLat, currentLng, maxStops = 5 } = req.query;

        // Get all items marked for donation that haven't expired
        const donations = await MenuItem.find({
            isDonationEligible: true,
            isAvailable: true,
            availableQuantity: { $gt: 0 },
            expiryTime: { $gt: new Date() }
        }).populate('restaurantId', 'name address coordinates');

        if (donations.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Neighborhood grid is clear. No unhandled surplus packets.',
                route: []
            });
        }

        // Prepare data for route planning
        const donationNodes = donations.map(d => ({
            id: d._id,
            name: d.name,
            quantity: d.availableQuantity,
            expiry: d.expiryTime,
            restaurant: d.restaurantId?.name,
            address: d.restaurantId?.address,
            coordinates: d.restaurantId?.coordinates
        }));

        // Try AI-powered route optimization first
        let route = null;

        if (geminiService.isConfigured('vision')) {
            try {
                const prompt = `You are NextPlate's NGO Rescue Dispatcher. Your goal is to optimize a multi-stop rescue route.
        
NGO Current Position: ${currentLat}, ${currentLng}
Available Donations: ${JSON.stringify(donationNodes)}
Max Stops Allowed: ${maxStops}

Analyze the locations and expiry times. Return a JSON array of the top ${maxStops} stops in the most logical sequence for a 1-hour window.
Prioritize stops that have items expiring SOONEST and are geographically CLOSEST to each other to minimize carbon emissions of the pickup vehicle.

Return ONLY valid JSON:
[
  {
    "id": "item_id",
    "name": "item_name",
    "restaurant": "restaurant_name",
    "address": "full_address string",
    "reason": "Why this stop should be in this sequence",
    "estimatedImpact": "Meals vs Carbon"
  }
]`;
                const responseText = await geminiService.generateContent(prompt, 'vision');
                const jsonMatch = responseText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    route = JSON.parse(jsonMatch[0]);
                }
            } catch (aiError) {
                logger.warn('AI route optimization failed, using fallback:', aiError?.message);
            }
        }

        // Fallback: sort by expiry (soonest first), then quantity (most meals first)
        if (!route) {
            const sorted = [...donationNodes]
                .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
                .slice(0, maxStops);

            route = sorted.map((node, i) => ({
                id: node.id,
                name: node.name,
                restaurant: node.restaurant || 'Unknown node',
                address: node.address || 'Address pending',
                reason: `Priority ${i + 1}: Expires ${new Date(node.expiry).toLocaleTimeString()} — ${node.quantity} units available`,
                estimatedImpact: `~${node.quantity} meals rescued, ~${(node.quantity * 0.8).toFixed(1)}kg CO2 saved`
            }));
        }

        return res.status(200).json({
            success: true,
            message: route.length > 0
                ? 'Stitch has calculated an optimal rescue trajectory.'
                : 'No viable rescue stops found.',
            route
        });

    } catch (error) {
        logger.error('NGO Route Optimizer error:', error);
        res.status(500).json({
            success: false,
            message: 'Stitch was unable to synchronize the neighborhood grid for route optimization.'
        });
    }
};

/**
 * NGO Hub Metrics
 */
exports.getHubMetrics = async (req, res) => {
    try {
        const Order = require('../models/Order');
        const startOfWeek = new Date();
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        const totalRescues = await Order.countDocuments({ customerId: req.user._id, orderStatus: 'completed' });
        const carbonSaved = await Order.aggregate([
            { $match: { customerId: req.user._id, orderStatus: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalCarbonSaved' } } }
        ]);

        res.status(200).json({
            success: true,
            metrics: {
                totalRescues,
                totalCarbonSaved: carbonSaved[0]?.total || 0,
                efficiencyRating: 9.8, // Static for now
                clearanceLevel: req.user.isVerifiedNGO ? 'Root Access' : 'Document-Verified'
            }
        });
    } catch (error) {
        logger.error('NGO Hub Metrics error:', error);
        res.status(500).json({ success: false, message: 'Failed to synchronize hub telemetry.' });
    }
};
