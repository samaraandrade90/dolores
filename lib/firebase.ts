import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';

// Updated Firebase configuration with your correct credentials
const firebaseConfig = {
  apiKey: "AIzaSyBcEESh2iKQSQk3G9gymmb7ab_HK1j4MEc",
  authDomain: "dolores-bb1ba.firebaseapp.com",
  projectId: "dolores-bb1ba",
  storageBucket: "dolores-bb1ba.firebasestorage.app",
  messagingSenderId: "940168064037",
  appId: "1:940168064037:web:c1f729d54e096db81623cc",
  measurementId: "G-0KR63G2MG9"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Analytics (if available)
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.log('Analytics não disponível:', error);
  }
}
export { analytics };

// Configuration for Cloud Messaging
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Your VAPID KEY
const VAPID_KEY = 'BM137RKplUu8hb5EYjxu47eRAqq_U5Ro8QoDoZ7E6vato9aAzSyhdkDaGF7EyOEeTniNC0oYHZbJJUTLBBXVc9U';

export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      throw new Error('Messaging não disponível');
    }

    console.log('Solicitando permissão de notificação...');
    
    // Check if permission is already granted
    if (Notification.permission === 'granted') {
      console.log('Permissão já concedida, obtendo token...');
    } else {
      // Request permission
      const permission = await Notification.requestPermission();
      console.log('Resultado da permissão:', permission);
      
      if (permission !== 'granted') {
        throw new Error('Permissão de notificação negada');
      }
    }
    
    // Get FCM token
    console.log('Obtendo token FCM...');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY
    });
    
    if (token) {
      console.log('Token FCM obtido:', token);
      return token;
    } else {
      throw new Error('Não foi possível obter o token FCM');
    }
  } catch (error) {
    console.error('Erro ao solicitar permissão:', error);
    throw error;
  }
};

export const onMessageListener = () => {
  return new Promise((resolve) => {
    if (!messaging) return;
    
    onMessage(messaging, (payload) => {
      console.log('Mensagem recebida em primeiro plano:', payload);
      resolve(payload);
    });
  });
};

// Hook to integrate with the application
export const useNotifications = () => {
  const requestPermission = async () => {
    try {
      const token = await requestNotificationPermission();
      
      // Here you can save the token to Supabase user_profiles
      // TODO: Implement token saving to database
      console.log('Token para salvar no banco:', token);
      
      return token;
    } catch (error) {
      console.error('Erro ao configurar notificações:', error);
      throw error;
    }
  };

  const setupForegroundListener = () => {
    if (!messaging) return;
    
    onMessage(messaging, (payload) => {
      console.log('Notificação recebida em primeiro plano:', payload);
      
      // Show custom notification or toast
      if (payload.notification) {
        console.log('Título:', payload.notification.title);
        console.log('Corpo:', payload.notification.body);
        
        // You can use toast here if available
        // toast.success(payload.notification.title, {
        //   description: payload.notification.body
        // });
      }
    });
  };

  return {
    requestPermission,
    setupForegroundListener
  };
};

// Function to send test notification
export const sendTestNotification = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Teste de Notificação - Dolores', {
      body: 'As notificações estão funcionando! 🎉',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png'
    });
    return true;
  } else {
    console.log('Permissão de notificação não concedida ou não disponível');
    return false;
  }
};

// Get Firebase status for debugging
export const getFirebaseStatus = () => {
  return {
    app: !!app,
    messaging: !!messaging,
    analytics: !!analytics,
    notification_support: 'Notification' in window,
    notification_permission: typeof window !== 'undefined' ? Notification.permission : 'unknown',
    vapid_key: VAPID_KEY.substring(0, 10) + '...',
    config: {
      projectId: firebaseConfig.projectId,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId.substring(0, 20) + '...'
    }
  };
};