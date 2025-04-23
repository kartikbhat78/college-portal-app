export function register(config) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('✅ Service Worker registered successfully');
          
          // Check if there's a new service worker waiting to activate
          if (registration.waiting) {
            console.log('New service worker is waiting to activate');
            // You can notify the user or automatically update
            if (config?.autoUpdate) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          }
          
          // Add listener for new service workers
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New content is available, notify user or auto-update
                    console.log('New service worker is installed and waiting');
                    if (config?.onUpdate) config.onUpdate(registration);
                    if (config?.autoUpdate) {
                      installingWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                  } else {
                    // First time install
                    console.log('Service Worker installed for the first time');
                    if (config?.onSuccess) config.onSuccess(registration);
                  }
                }
              });
            }
          });
          
          // Add listener for controller change (when skipWaiting is called)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('New service worker activated');
            if (config?.onControllerChange) {
              config.onControllerChange();
            } else if (config?.reloadOnUpdate) {
              window.location.reload();
            }
          });
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed:', error);
        });
    });
  }
}

// Function to request sync - returns a promise
export function requestBackgroundSync(syncTag = 'sync-data') {
  return new Promise((resolve, reject) => {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      return reject(new Error('Background Sync not supported'));
    }

    navigator.serviceWorker.ready
      .then(registration => {
        return registration.sync.register(syncTag)
          .then(() => {
            console.log(`✅ Background sync registered: ${syncTag}`);
            resolve();
          })
          .catch(error => {
            console.error('❌ Background sync registration failed:', error);
            reject(error);
          });
      })
      .catch(reject);
  });
}

// Function to request push notification permission and subscribe
export function subscribeToPushNotifications() {
  return new Promise((resolve, reject) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return reject(new Error('Push notifications not supported'));
    }

    let swReg;
    navigator.serviceWorker.ready
      .then(registration => {
        swReg = registration;
        return registration.pushManager.getSubscription();
      })
      .then(subscription => {
        if (subscription) {
          console.log('User is already subscribed to push notifications');
          return subscription;
        }

        // Request permission
        return Notification.requestPermission()
          .then(permission => {
            if (permission !== 'granted') {
              throw new Error('Permission not granted for notifications');
            }

            // This would typically come from your server
            const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            // Subscribe the user
            return swReg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidKey
            });
          });
      })
      .then(subscription => {
        console.log('User subscribed to push notifications:', subscription);
        
        // In a real app, you would send this subscription to your server
        // fetch('/api/save-subscription', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(subscription)
        // });
        
        // Check for any pending notifications
        checkPendingNotifications();
        
        resolve(subscription);
      })
      .catch(error => {
        console.error('Failed to subscribe to push notifications:', error);
        reject(error);
      });
  });
}

// Helper function to convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Function to check for pending notifications
export function checkPendingNotifications() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        // Send message to service worker to check for pending notifications
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CHECK_PENDING_NOTIFICATIONS'
          });
          console.log('Requested service worker to check for pending notifications');
        } else {
          console.log('No active service worker to check for notifications');
        }
      })
      .catch(error => {
        console.error('Error checking for pending notifications:', error);
      });
  }
}

// Function to update service worker immediately
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        // Check for updates
        registration.update()
          .then(() => {
            console.log('Service worker update check initiated');
            
            // If there's a waiting worker, activate it
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              console.log('Asked waiting service worker to skip waiting');
            }
          })
          .catch(error => {
            console.error('Error updating service worker:', error);
          });
      });
  }
}
