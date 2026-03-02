const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Twilio Service using REST API
 */
const getTwilioConfig = () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken) {
        logger.error('❌ Twilio Credentials Missing in .env');
        return null;
    }

    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    return { accountSid, authToken, serviceSid, authHeader };
};

/**
 * Send SMS via Twilio
 */
exports.sendSMS = async (to, body) => {
    const config = getTwilioConfig();
    if (!config) throw new Error('Twilio configuration missing');
    const { accountSid, authHeader } = config;
    try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const params = new URLSearchParams();
        params.append('To', to);
        params.append('From', process.env.TWILIO_PHONE_NUMBER || ''); // Needs to be configured in .env
        params.append('Body', body);

        const response = await axios.post(url, params.toString(), {
            headers: {
                'Authorization': `Basic ${authHeader}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        logger.info(`✅ SMS sent via Twilio to: ${to}`);
        return response.data;
    } catch (error) {
        logger.error('❌ Twilio SMS Error:', error.response ? error.response.data : error.message);
        throw new Error('Failed to send SMS');
    }
};

/**
 * Send WhatsApp via Twilio
 */
exports.sendWhatsApp = async (to, body) => {
    const config = getTwilioConfig();
    if (!config) throw new Error('Twilio configuration missing');
    const { accountSid, authHeader } = config;
    try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const params = new URLSearchParams();
        params.append('To', `whatsapp:${to}`);
        params.append('From', process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886');
        params.append('Body', body);

        const response = await axios.post(url, params.toString(), {
            headers: {
                'Authorization': `Basic ${authHeader}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        logger.info(`✅ WhatsApp sent via Twilio to: ${to}`);
        return response.data;
    } catch (error) {
        logger.error('❌ Twilio WhatsApp Error:', error.response ? error.response.data : error.message);
        throw new Error('Failed to send WhatsApp message');
    }
};

/**
 * Send OTP via Twilio Verify (Recommended for security)
 */
exports.sendVerifyOTP = async (to, channel = 'sms') => {
    const config = getTwilioConfig();
    if (!config) throw new Error('Twilio configuration missing');
    const { accountSid, serviceSid, authHeader } = config;

    try {
        if (!serviceSid) throw new Error('TWILIO_VERIFY_SERVICE_SID not configured');

        logger.info(`📱 Twilio Verify: Sending ${channel} OTP to ${to}`);
        logger.info(`   Account SID: ${accountSid ? accountSid.substring(0, 10) + '...' : 'MISSING'}`);
        logger.info(`   Service SID: ${serviceSid ? serviceSid.substring(0, 10) + '...' : 'MISSING'}`);

        const url = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;
        const params = new URLSearchParams();
        params.append('To', to);
        params.append('Channel', channel);

        const response = await axios.post(url, params.toString(), {
            headers: {
                'Authorization': `Basic ${authHeader}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        logger.info(`✅ Twilio Verify OTP sent to: ${to} via ${channel}`);
        return response.data;
    } catch (error) {
        const errData = error.response ? error.response.data : error.message;
        const errStatus = error.response ? error.response.status : 'N/A';
        const errString = typeof errData === 'object' ? JSON.stringify(errData) : errData;
        logger.error(`❌ Twilio Verify Error (HTTP ${errStatus}): ${errString}`);
        throw new Error('Failed to send verification code');
    }
};


/**
 * Check OTP via Twilio Verify
 */
exports.checkVerifyOTP = async (to, code) => {
    const config = getTwilioConfig();
    if (!config) throw new Error('Twilio configuration missing');
    const { serviceSid, authHeader } = config;

    try {
        if (!serviceSid) throw new Error('TWILIO_VERIFY_SERVICE_SID not configured');

        const url = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`;
        const params = new URLSearchParams();
        params.append('To', to);
        params.append('Code', code);

        const response = await axios.post(url, params.toString(), {
            headers: {
                'Authorization': `Basic ${authHeader}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        logger.info(`🔍 Twilio Verify Check for ${to}: ${response.data.status}`);
        return response.data; // status will be 'approved' if correct
    } catch (error) {
        logger.error('❌ Twilio Verify Check Error:', error.response ? error.response.data : error.message);
        return { status: 'failed', error: error.message };
    }
};
