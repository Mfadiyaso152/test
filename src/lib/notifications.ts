/**
 * Native Device Push Notification Helper
 * Sends notifications directly to the user's mobile device / browser
 */

export async function requestDeviceNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser/device does not support native desktop/mobile notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return false;
    }
  }

  return false;
}

export function sendDevicePushNotification(title: string, options?: { body?: string; tag?: string; icon?: string }) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body: options?.body,
            icon: options?.icon || '/favicon.ico',
            tag: options?.tag || 'field-service-notification',
            badge: '/favicon.ico',
            dir: 'rtl',
            lang: 'ar',
          } as NotificationOptions);
        }).catch(() => {
          new Notification(title, {
            body: options?.body,
            icon: options?.icon || '/favicon.ico',
            tag: options?.tag || 'field-service-notification',
            dir: 'rtl',
            lang: 'ar',
          });
        });
      } else {
        new Notification(title, {
          body: options?.body,
          icon: options?.icon || '/favicon.ico',
          tag: options?.tag || 'field-service-notification',
          dir: 'rtl',
          lang: 'ar',
        });
      }
    } catch (e) {
      console.warn('Native notification trigger notice:', e);
    }
  } else if (Notification.permission !== 'denied') {
    // Request permission for future notifications
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        try {
          new Notification(title, {
            body: options?.body,
            icon: options?.icon || '/favicon.ico',
            tag: options?.tag || 'field-service-notification',
            dir: 'rtl',
            lang: 'ar',
          });
        } catch {}
      }
    });
  }
}
