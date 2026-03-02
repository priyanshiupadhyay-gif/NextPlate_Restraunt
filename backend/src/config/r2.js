const { S3Client } = require('@aws-sdk/client-s3');

/**
 * Cloudflare R2 Configuration
 * R2 is S3-compatible, so we use the AWS SDK with custom endpoint
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Validate R2 configuration
const isR2Configured = () => {
    return R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME;
};

// Create S3 client for R2
const createR2Client = () => {
    if (!isR2Configured()) {
        console.warn('⚠️  Cloudflare R2 is not fully configured. Image uploads will fail.');
        return null;
    }

    return new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    });
};

const r2Client = createR2Client();

module.exports = {
    r2Client,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL,
    isR2Configured,
};
