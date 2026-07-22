'use client';

import { useEffect, useState } from 'react';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BBEiWvO_Kz0V3aD_6jVdO7tD6-WbE8tYyL-hKzTqN7xYw6Hw5D6cQ7n3wV5_D3Z9qGz_X3R_Jk4Z5NqZ6wXjE8g';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          console.log('Service Worker Registered');
          
          // Request permission on mount if we haven't already
          if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                subscribeUser(registration);
              }
            });
          } else if (Notification.permission === 'granted') {
            // Check if already subscribed
            registration.pushManager.getSubscription().then(sub => {
              if (sub) {
                setIsSubscribed(true);
              } else {
                subscribeUser(registration);
              }
            });
          }
        })
        .catch(function(error) {
          console.error('Service Worker Registration Failed', error);
        });
    }
  }, []);

  const subscribeUser = async (registration: ServiceWorkerRegistration) => {
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
      
      const subJson = subscription.toJSON();
      
      // Send to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5031'}/api/push/subscribe`, {
        method: 'POST',
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsSubscribed(true);
      }
    } catch (e) {
      console.error('Failed to subscribe user to push notifications: ', e);
    }
  };

  return null; // Silent component
}
