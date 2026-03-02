/**
 * Firebase Admin SDK Configuration
 * For sending push notifications via Firebase Cloud Messaging (FCM)
 */

const admin = require('firebase-admin');

// Firebase service account credentials from environment
const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialize Firebase Admin only if not already initialized
let firebaseApp = null;

const initializeFirebase = () => {
    if (firebaseApp) {
        return firebaseApp;
    }

    if (!firebaseConfig.projectId || !firebaseConfig.privateKey || !firebaseConfig.clientEmail) {
        console.warn('⚠️  Firebase credentials not configured. Push notifications will be disabled.');
        return null;
    }

    try {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig),
        });
        console.log('✅ Firebase Admin SDK initialized');
        return firebaseApp;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
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
