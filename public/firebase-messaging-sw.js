importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBcEESh2iKQSQk3G9gymmb7ab_HK1j4MEc",
  authDomain: "dolores-bb1ba.firebaseapp.com",
  projectId: "dolores-bb1ba",
  storageBucket: "dolores-bb1ba.firebasestorage.app",
  messagingSenderId: "940168064037",
  appId: "1:940168064037:web:c1f729d54e096db81623cc",
  measurementId: "G-0KR63G2MG9"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Mensagem recebida em background:', payload);
  
  const notificationTitle = payload.notification?.title || 'Nova notificação - Dolores';
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova tarefa!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Abrir App'
      },
      {
        action: 'dismiss', 
        title: 'Dispensar'
      }
    ],
    tag: 'dolores-task-reminder',
    requireInteraction: false,
    silent: false
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event.notification);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    // Open the app when notification is clicked
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If there's already a window open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification (already done above)
    console.log('Notificação dispensada');
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notificação fechada:', event.notification);
});

// Optional: Handle push events directly (if not using onBackgroundMessage)
self.addEventListener('push', (event) => {
  console.log('Push event recebido:', event);
  
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('Push payload:', payload);
      
      // This will be handled by onBackgroundMessage above
      // but we can add additional logic here if needed
    } catch (error) {
      console.error('Erro ao processar push payload:', error);
    }
  }
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('Firebase Service Worker instalado');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('Firebase Service Worker ativado');
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});