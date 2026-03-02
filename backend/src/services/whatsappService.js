const axios = require('axios');
const logger = require('../utils/logger');

/**
 * WhatsApp Business Cloud API Service
 */
exports.sendWhatsAppOTP = async (phoneNumber, code) => {
    try {
        const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

        const data = {
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "template",
            template: {
                name: "otp_verification", // Ensure this template exists in your Meta Business account
                language: {
                    code: "en_US"
                },
                components: [
                    {
                        type: "body",
                        parameters: [
                            {
                                type: "text",
                                text: code
                            }
                        ]
                    },
                    {
                        type: "button",
                        sub_type: "url",
                        index: "0",
                        parameters: [
                            {
                                type: "text",
                                text: code
                            }
                        ]
                    }
                ]
            }
        };

        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        logger.info(`✅ OTP sent to WhatsApp: ${phoneNumber}`);
        return response.data;
    } catch (error) {
        logger.error('❌ WhatsApp API Error:', error.response ? error.response.data : error.message);
        throw new Error('Failed to send WhatsApp OTP');
    }
};
