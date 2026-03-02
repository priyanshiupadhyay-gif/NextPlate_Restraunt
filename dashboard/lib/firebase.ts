import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

// Firebase Web App Config
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC9s3Fbq6WtXpU3DdUAY3jSvAp1xPkiwN0",
    authDomain: "nextplate-67c72.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nextplate-67c72",
    storageBucket: "nextplate-67c72.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID || "1055229650886",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1055229650886:web:4c4bd2fdfff5c531a134c7",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-5ES91YZGLC",
};

// Initialize Firebase (only once)
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Analytics (only if supported and on client side)
if (typeof window !== 'undefined') {
    isAnalyticsSupported().then(supported => {
        if (supported) {
            getAnalytics(firebaseApp);
        }
    });
}

// Get FCM token for the current device/browser
export const getFCMToken = async (): Promise<string | null> => {
    try {
        if (typeof window === 'undefined') return null;

        const supported = await isSupported();
        if (!supported) {
            console.warn('Firebase Messaging not supported in this browser');
            return null;
        }

        const messaging = getMessaging(firebaseApp);

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('Notification permission denied');
            return null;
        }

        // Get FCM token using the VAPID key
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey || vapidKey === 'YOUR_VAPID_KEY_HERE') {
            console.warn('VAPID key not configured — push notifications disabled');
            return null;
        }

        // Register service worker and wait for it to be active
        let swRegistration: ServiceWorkerRegistration;
        try {
            swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            // Wait for the service worker to be ready (active state)
            if (!swRegistration.active) {
                await new Promise<void>((resolve) => {
                    const sw = swRegistration.installing || swRegistration.waiting;
                    if (!sw) { resolve(); return; }
                    sw.addEventListener('statechange', function handler() {
                        if (sw.state === 'activated') {
                            sw.removeEventListener('statechange', handler);
                            resolve();
                        }
                    });
                    // Timeout fallback — don't hang forever
                    setTimeout(resolve, 5000);
                });
            }
        } catch (swError) {
            console.warn('Service worker registration failed:', swError);
            return null;
        }

        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: swRegistration
        });

        return token || null;
    } catch (error) {
        console.warn('FCM token retrieval skipped:', (error as any)?.message || error);
        return null;
    }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
    if (typeof window === 'undefined') return () => { };

    let unsubscribe = () => { };

    isSupported().then((supported) => {
        if (!supported) return;
        const messaging = getMessaging(firebaseApp);
        unsubscribe = onMessage(messaging, callback);
    });

    return () => unsubscribe();
};

export { firebaseApp };
