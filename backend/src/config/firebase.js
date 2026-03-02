/**
 * Firebase Admin SDK Configuration
 * For sending push notifications via Firebase Cloud Messaging (FCM)
 */

const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Firebase service account credentials from environment
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || '';
const privateKey = rawPrivateKey
    .replace(/\\n/g, '\n') // Replace literal \n with real newlines
    .trim()                 // Remove any leading/trailing whitespace
    .replace(/^["']|["']$/g, ''); // Remove outer quotes if they exist

const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: privateKey,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialize Firebase Admin only if not already initialized
let firebaseApp = null;

const initializeFirebase = () => {
    if (firebaseApp) {
        return firebaseApp;
    }

    if (!firebaseConfig.projectId || !firebaseConfig.privateKey || !firebaseConfig.clientEmail) {
        logger.warn('⚠️  Firebase credentials not configured. Push notifications will be disabled.');
        return null;
    }

    try {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig),
        });
        logger.info('✅ Firebase Admin SDK initialized');
        return firebaseApp;
    } catch (error) {
        logger.error('❌ Firebase initialization error:', error);
        return null;
    }
};

// Check if Firebase is configured
const isFirebaseConfigured = () => {
    return !!(firebaseConfig.projectId && firebaseConfig.privateKey && firebaseConfig.clientEmail);
};

// Get Firebase messaging instance
const getMessaging = () => {
    if (!firebaseApp) {
        initializeFirebase();
    }
    return firebaseApp ? admin.messaging() : null;
};

module.exports = {
    initializeFirebase,
    isFirebaseConfigured,
    getMessaging,
    admin,
};
