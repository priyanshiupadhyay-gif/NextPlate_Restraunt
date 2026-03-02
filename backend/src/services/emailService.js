const axios = require('axios');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * SendGrid API Helper (To avoid extra dependencies)
 */
const sendViaSendGrid = async (options) => {
  const url = 'https://api.sendgrid.com/v3/mail/send';
  const data = {
    personalizations: [{ to: [{ email: options.to }] }],
    from: { email: process.env.EMAIL_FROM, name: 'NextPlate' },
    subject: options.subject,
    content: [{ type: 'text/html', value: options.html }]
  };

  return axios.post(url, data, {
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Nodemailer Transporter (Backup / Development)
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.sendVerificationEmail = async (email, token, otp) => {
  const url = `${process.env.VERIFY_EMAIL_URL}?token=${token}`;
  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #00B251; text-align: center;">Welcome to NextPlate!</h2>
        <p>Thank you for joining our mission to reduce food waste. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #00B251; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <p style="color: #666;">Or enter this 6-digit code on the verification page:</p>
          <h1 style="background-color: #f4f4f4; display: inline-block; padding: 10px 20px; letter-spacing: 5px; border-radius: 10px; color: #1C1207;">${otp}</h1>
        </div>

        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${url}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">This link will expire in 24 hours.</p>
      </div>
    `;

  try {
    if (process.env.SENDGRID_API_KEY) {
      const response = await sendViaSendGrid({ to: email, subject: 'Verify your NextPlate account', html });
      logger.info(`📧 SendGrid Verification Email accepted (Status: ${response.status}). Recipient: ${email}`);
    } else {
      const info = await transporter.sendMail({ from: `"NextPlate" <${process.env.EMAIL_FROM}>`, to: email, subject: 'Verify your NextPlate account', html });
      logger.info(`📧 SMTP Verification Email sent. Message ID: ${info.messageId}. Recipient: ${email}`);
    }
  } catch (error) {
    const errorData = error.response ? error.response.data : error.message;
    const errorStatus = error.response ? error.response.status : 'N/A';
    logger.error(`❌ Email Delivery Failure (Status: ${errorStatus}): ${JSON.stringify(errorData)}`);
    throw new Error('Failed to send verification email');
  }
};

exports.sendOTPEmail = async (email, code) => {
  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #00B251; text-align: center;">Verification Code</h2>
        <p>Use the following code to complete your verification:</p>
        <div style="text-align: center; margin: 30px 0;">
          <h1 style="background-color: #f4f4f4; display: inline-block; padding: 10px 20px; letter-spacing: 5px; border-radius: 5px;">${code}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      </div>
    `;

  try {
    if (process.env.SENDGRID_API_KEY) {
      const response = await sendViaSendGrid({ to: email, subject: 'Your NextPlate Verification Code', html });
      logger.info(`📧 SendGrid OTP Email accepted (Status: ${response.status}). Recipient: ${email}`);
    } else {
      const info = await transporter.sendMail({ from: `"NextPlate" <${process.env.EMAIL_FROM}>`, to: email, subject: 'Your NextPlate Verification Code', html });
      logger.info(`📧 SMTP OTP Email sent. Message ID: ${info.messageId}. Recipient: ${email}`);
    }
  } catch (error) {
    const errorData = error.response ? error.response.data : error.message;
    const errorStatus = error.response ? error.response.status : 'N/A';
    logger.error(`❌ OTP Delivery Failure (Status: ${errorStatus}): ${JSON.stringify(errorData)}`);
    throw new Error('Failed to send OTP email');
  }
};

exports.sendCustomEmail = async (to, subject, html) => {
  try {
    if (process.env.SENDGRID_API_KEY) {
      const response = await sendViaSendGrid({ to, subject, html });
      logger.info(`📧 Custom email sent via SendGrid to ${to} (Status: ${response.status})`);
    } else {
      const info = await transporter.sendMail({ from: `"NextPlate" <${process.env.EMAIL_FROM}>`, to, subject, html });
      logger.info(`📧 Custom email sent via SMTP to ${to}. ID: ${info.messageId}`);
    }
  } catch (error) {
    logger.error(`❌ Custom email failed to ${to}: ${error.message}`);
  }
};

// ─── Password Reset Email ───
exports.sendPasswordResetEmail = async (email, resetUrl) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #fafafa;">
      <div style="background: linear-gradient(135deg, #1C1207 0%, #3d2a0f 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
        <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">NextPlate Security Protocol</p>
      </div>
      <div style="background: #fff; padding: 40px 30px; border-radius: 0 0 16px 16px; border: 1px solid #eee;">
        <p style="color: #333; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Click below to set a new one:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 16px 48px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #999; font-size: 13px;">This link expires in <strong>30 minutes</strong>. If you didn't request this, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 24px 0;">
        <p style="font-size: 11px; color: #bbb; text-align: center;">NextPlate — Zero Waste Network</p>
      </div>
    </div>`;
  try {
    if (process.env.SENDGRID_API_KEY) {
      await sendViaSendGrid({ to: email, subject: '🔐 Reset Your NextPlate Password', html });
    } else {
      await transporter.sendMail({ from: `"NextPlate" <${process.env.EMAIL_FROM}>`, to: email, subject: '🔐 Reset Your NextPlate Password', html });
    }
    logger.info(`📧 Password reset email sent to ${email}`);
  } catch (error) {
    logger.error(`❌ Password reset email failed to ${email}: ${error.message}`);
    throw new Error('Failed to send reset email');
  }
};

// ─── Order Confirmation Email ───
exports.sendOrderConfirmation = async (email, order) => {
  const itemsList = (order.items || []).map(i => `<li style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${i.quantity}x ${i.name} — <strong>$${i.itemTotal?.toFixed(2) || '0.00'}</strong></li>`).join('');
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa;">
      <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 28px;">✅ Order Confirmed!</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Order #${order.orderNumber || order._id?.toString().slice(-6)}</p>
      </div>
      <div style="background: #fff; padding: 40px 30px; border-radius: 0 0 16px 16px; border: 1px solid #eee;">
        <ul style="list-style: none; padding: 0; margin: 0 0 20px;">${itemsList}</ul>
        <div style="background: #f9fafb; padding: 16px; border-radius: 12px; text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1C1207;">$${order.totalAmount?.toFixed(2) || '0.00'}</p>
          <p style="margin: 4px 0 0; color: #999; font-size: 12px;">Total Amount</p>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">🌱 You saved <strong>${(order.totalCarbonSaved || 0).toFixed(1)}kg CO₂</strong> with this order!</p>
        <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 24px 0;">
        <p style="font-size: 11px; color: #bbb; text-align: center;">NextPlate — Every meal rescued matters 🌍</p>
      </div>
    </div>`;
  try {
    if (process.env.SENDGRID_API_KEY) {
      await sendViaSendGrid({ to: email, subject: `✅ Order #${order.orderNumber || 'Confirmed'} — NextPlate`, html });
    } else {
      await transporter.sendMail({ from: `"NextPlate" <${process.env.EMAIL_FROM}>`, to: email, subject: `✅ Order Confirmed — NextPlate`, html });
    }
    logger.info(`📧 Order confirmation sent to ${email}`);
  } catch (error) {
    logger.error(`❌ Order confirmation email failed: ${error.message}`);
  }
};

// ─── Welcome Email ───
exports.sendWelcomeEmail = async (email, name, role) => {
  const roleMessages = {
    user: 'Start rescuing surplus meals, reducing waste, and earning impact badges.',
    restaurant: 'List your surplus food, reach eco-conscious customers, and generate CSR reports.',
    ngo: 'Claim donated meals, optimize rescue routes, and feed your community.'
  };
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa;">
      <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 28px;">🎉 Welcome, ${name}!</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">You're now part of the Zero Waste Network</p>
      </div>
      <div style="background: #fff; padding: 40px 30px; border-radius: 0 0 16px 16px; border: 1px solid #eee;">
        <p style="color: #333; font-size: 16px; line-height: 1.6;">${roleMessages[role] || roleMessages.user}</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.FRONTEND_URL}" style="background: #1C1207; color: white; padding: 16px 48px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">Open Dashboard</a>
        </div>
        <div style="display: flex; gap: 16px; margin: 24px 0;">
          <div style="flex: 1; background: #fff7ed; padding: 16px; border-radius: 12px; text-align: center;">
            <p style="font-size: 24px; margin: 0;">🍽️</p>
            <p style="font-size: 11px; color: #666; margin: 4px 0 0;">Rescue Meals</p>
          </div>
          <div style="flex: 1; background: #f0fdf4; padding: 16px; border-radius: 12px; text-align: center;">
            <p style="font-size: 24px; margin: 0;">🌱</p>
            <p style="font-size: 11px; color: #666; margin: 4px 0 0;">Save Carbon</p>
          </div>
          <div style="flex: 1; background: #fef3c7; padding: 16px; border-radius: 12px; text-align: center;">
            <p style="font-size: 24px; margin: 0;">🏅</p>
            <p style="font-size: 11px; color: #666; margin: 4px 0 0;">Earn Badges</p>
          </div>
        </div>
        <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 24px 0;">
        <p style="font-size: 11px; color: #bbb; text-align: center;">NextPlate — Zero Waste Network 🌍</p>
      </div>
    </div>`;
  try {
    if (process.env.SENDGRID_API_KEY) {
      await sendViaSendGrid({ to: email, subject: `🎉 Welcome to NextPlate, ${name}!`, html });
    } else {
      await transporter.sendMail({ from: `"NextPlate" <${process.env.EMAIL_FROM}>`, to: email, subject: `Welcome to NextPlate!`, html });
    }
    logger.info(`📧 Welcome email sent to ${email}`);
  } catch (error) {
    logger.error(`❌ Welcome email failed: ${error.message}`);
  }
};

// ─── Weekly Impact Digest ───
exports.sendWeeklyDigest = async (email, name, stats) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa;">
      <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 28px;">📊 Your Weekly Impact</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Hello ${name}, here's your community impact this week</p>
      </div>
      <div style="background: #fff; padding: 40px 30px; border-radius: 0 0 16px 16px; border: 1px solid #eee;">
        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <div style="flex: 1; background: #f0fdf4; padding: 20px; border-radius: 12px; text-align: center;">
            <p style="font-size: 32px; font-weight: bold; color: #059669; margin: 0;">${stats.mealsRescued || 0}</p>
            <p style="font-size: 11px; color: #666; margin: 4px 0 0;">Meals Rescued</p>
          </div>
          <div style="flex: 1; background: #f0f9ff; padding: 20px; border-radius: 12px; text-align: center;">
            <p style="font-size: 32px; font-weight: bold; color: #0284c7; margin: 0;">${(stats.carbonSaved || 0).toFixed(1)}kg</p>
            <p style="font-size: 11px; color: #666; margin: 4px 0 0;">CO₂ Saved</p>
          </div>
          <div style="flex: 1; background: #fff7ed; padding: 20px; border-radius: 12px; text-align: center;">
            <p style="font-size: 32px; font-weight: bold; color: #ea580c; margin: 0;">$${(stats.moneySaved || 0).toFixed(0)}</p>
            <p style="font-size: 11px; color: #666; margin: 4px 0 0;">Saved</p>
          </div>
        </div>
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/impact-stats" style="background: #7c3aed; color: white; padding: 14px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">View Full Impact Report</a>
        </div>
        <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 24px 0;">
        <p style="font-size: 11px; color: #bbb; text-align: center;">NextPlate — Every meal rescued matters 🌍</p>
      </div>
    </div>`;
  try {
    if (process.env.SENDGRID_API_KEY) {
      await sendViaSendGrid({ to: email, subject: `📊 Your Weekly Impact Report — NextPlate`, html });
    } else {
      await transporter.sendMail({ from: `"NextPlate" <${process.env.EMAIL_FROM}>`, to: email, subject: `Your Weekly Impact Report`, html });
    }
    logger.info(`📧 Weekly digest sent to ${email}`);
  } catch (error) {
    logger.error(`❌ Weekly digest failed: ${error.message}`);
  }
};
