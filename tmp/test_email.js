const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const sendTestEmail = async () => {
    const url = 'https://api.sendgrid.com/v3/mail/send';
    const data = {
        personalizations: [{ to: [{ email: 'urjitupadhyayuu@gmail.com' }] }],
        from: { email: process.env.EMAIL_FROM, name: 'NextPlate Test' },
        subject: 'NextPlate Test Email',
        content: [{ type: 'text/plain', value: 'This is a test email to verify SendGrid configuration.' }]
    };

    console.log('Sending to:', 'urjitupadhyayuu@gmail.com');
    console.log('From:', process.env.EMAIL_FROM);
    console.log('API Key tail:', process.env.SENDGRID_API_KEY.slice(-5));

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
    }
};

sendTestEmail();
