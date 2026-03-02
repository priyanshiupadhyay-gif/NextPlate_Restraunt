// Firebase Service Worker for Background Push Notifications
// This file MUST be in the /public directory

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// New Firebase Configuration (v9/v10 Compat)
const firebaseConfig = {
    apiKey: "AIzaSyC9s3Fbq6WtXpU3DdUAY3jSvAp1xPkiwN0",
    authDomain: "nextplate-67c72.firebaseapp.com",
    projectId: "nextplate-67c72",
    storageBucket: "nextplate-67c72.firebasestorage.app",
    messagingSenderId: "1055229650886",
    appId: "1:1055229650886:web:4c4bd2fdfff5c531a134c7",
    measurementId: "G-5ES91YZGLC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const notificationTitle = payload.notification?.title || '📦 NextPlate Alert';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new update.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: payload.data?.type || 'nextplate',
        data: payload.data,
        actions: [
            { action: 'open', title: 'View Details' },
            { action: 'dismiss', title: 'Dismiss' }
        ],
        vibrate: [200, 100, 200],
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const orderId = event.notification.data?.orderId;
    const type = event.notification.data?.type;

    let url = '/';
    if (type === 'new_order' || type === 'ready' || type === 'pickup_reminder') {
        url = orderId ? `/orders/${orderId}` : '/orders';
    } else if (type === 'new_surplus') {
        url = '/feed';
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const existingWindow = clientList.find(c => c.url.includes(self.location.origin));
            if (existingWindow) {
                existingWindow.focus();
                existingWindow.navigate(url);
            } else {
                clients.openWindow(url);
            }
        })
    );
});
