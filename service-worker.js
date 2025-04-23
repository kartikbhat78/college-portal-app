const CACHE_NAME = 'college-portal-cache-v1';
const DYNAMIC_CACHE = 'college-portal-dynamic-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add more static assets here
];

// Database for storing requests that need to be synced
const DB_NAME = 'college-portal-sync-db';
const STORE_NAME = 'sync-requests';

// INSTALL: Pre-cache
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching assets');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('[SW] Pre-cache error:', err))
  );
  self.skipWaiting();
  console.log('[SW] Service Worker installed and skipped waiting');
});

// ACTIVATE: Clear old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
  console.log('[SW] Service Worker activated and claimed clients');
});

// FETCH: Improved strategy - Cache, falling back to network with dynamic caching
self.addEventListener('fetch', (event) => {
  console.log('[SW] Fetch event for:', event.request.url);
  
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || 
      !event.request.url.startsWith('http')) {
    console.log('[SW] Ignoring non-GET or non-HTTP request:', event.request.url);
    return;
  }

  // Handle API requests differently (don't cache by default)
  if (event.request.url.includes('/api/')) {
    console.log('[SW] Handling API request:', event.request.url);
    handleApiRequest(event);
    return;
  }

  // For other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          // Return cached response and update cache in background
          updateCacheInBackground(event.request);
          return cachedResponse;
        }

        console.log('[SW] Not in cache, fetching from network:', event.request.url);
        // Not in cache, get from network
        return fetch(event.request)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              console.log('[SW] Not caching non-success response for:', event.request.url, response?.status);
              return response;
            }

            console.log('[SW] Caching network response for:', event.request.url);
            // Clone the response
            const responseToCache = response.clone();

            // Add to dynamic cache
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('[SW] Added to dynamic cache:', event.request.url);
              });

            return response;
          })
          .catch(error => {
            console.log('[SW] Fetch failed, serving offline page:', error);
            return caches.match('/offline.html')
              .then(offlineResponse => {
                return offlineResponse || new Response('You are offline', { 
                  status: 503,
                  headers: { 'Content-Type': 'text/plain' }
                });
              });
          });
      })
  );
});

// Update cache in background without blocking response
function updateCacheInBackground(request) {
  fetch(request)
    .then(response => {
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return;
      }
      
      caches.open(DYNAMIC_CACHE).then(cache => {
        cache.put(request, response);
        console.log('[SW] Updated cache in background for:', request.url);
      });
    })
    .catch(err => {
      console.log('[SW] Background update failed:', err);
    });
}

// Handle API requests - don't cache by default, but store failed requests for sync
function handleApiRequest(event) {
  event.respondWith(
    fetch(event.request.clone())
      .then(response => {
        return response;
      })
      .catch(err => {
        console.log('[SW] API request failed, saving for later sync:', event.request.url);
        // Store for later sync
        saveRequestForSync(event.request.clone());
        
        return new Response(JSON.stringify({ error: 'Network error, request saved for sync' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        });
      })
  );
}

// Save failed request to IndexedDB for later sync
function saveRequestForSync(request) {
  return request.text().then(body => {
    return getDB().then(db => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      const requestToStore = {
        url: request.url,
        method: request.method,
        headers: Array.from(request.headers.entries()),
        body: body,
        timestamp: Date.now()
      };
      
      store.add(requestToStore);
      console.log('[SW] Saved request for later sync:', request.url);
      return tx.complete;
    });
  });
}

// Get IndexedDB instance
function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = event => {
      console.error('[SW] IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      // Create the sync-requests store if missing
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        console.log('[SW] Created sync-requests store');
      }
      // Create the notifications store if missing
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
        console.log('[SW] Created notifications store');
      }
    };
    
    request.onsuccess = event => {
      const db = event.target.result;
      // Add event handler for version change
      db.onversionchange = () => {
        db.close();
        console.log('[SW] Database closed due to version change');
      };
      resolve(db);
    };
  });
}

// BACKGROUND SYNC: Improved implementation
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event received:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  } else if (event.tag.startsWith('form-')) {
    // Handle specific form syncs
    const formId = event.tag.replace('form-', '');
    event.waitUntil(syncForm(formId));
  }
});

// Sync all pending requests
function syncData() {
  console.log('[SW] Starting sync of all pending requests');
  
  return getDB().then(db => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return store.getAll().then(requests => {
      console.log('[SW] Found pending requests:', requests.length);
      
      const syncPromises = requests.map(request => {
        return fetch(request.url, {
          method: request.method,
          headers: new Headers(request.headers),
          body: request.body,
          credentials: 'include'
        })
        .then(response => {
          if (response.ok) {
            console.log('[SW] Synced request successfully:', request.url);
            // Delete from store if successful
            const deleteTransaction = db.transaction(STORE_NAME, 'readwrite');
            const deleteStore = deleteTransaction.objectStore(STORE_NAME);
            return deleteStore.delete(request.id).then(() => {
              // Notify clients about successful sync
              self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                  client.postMessage({
                    type: 'SYNC_SUCCESS',
                    url: request.url,
                    timestamp: new Date().toISOString()
                  });
                });
              });
            });
          } else {
            console.error('[SW] Failed to sync request:', response.status);
          }
        })
        .catch(err => {
          console.error('[SW] Error syncing request:', err);
          // Keep in store to try again later
        });
      });
      
      return Promise.all(syncPromises);
    });
  });
}

// Sync a specific form
function syncForm(formId) {
  console.log('[SW] Syncing form data for:', formId);
  
  return getDB().then(db => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return store.getAll().then(requests => {
      // Filter requests related to this form
      const formRequests = requests.filter(req => {
        try {
          const data = JSON.parse(req.body);
          return data.formId === formId;
        } catch (e) {
          return false;
        }
      });
      
      if (formRequests.length === 0) {
        console.log('[SW] No pending requests for form:', formId);
        return Promise.resolve();
      }
      
      console.log('[SW] Found form requests to sync:', formRequests.length);
      
      // Process each form request
      const syncPromises = formRequests.map(request => {
        return fetch(request.url, {
          method: request.method,
          headers: new Headers(request.headers),
          body: request.body
        })
        .then(response => {
          if (response.ok) {
            // Delete from store if successful
            return store.delete(request.id).then(() => {
              // Show notification for successful sync
              return self.registration.showNotification('Form Synced', {
                body: 'Your form has been successfully submitted.',
                icon: '/icons/icon-192x192.png'
              });
            });
          }
        });
      });
      
      return Promise.all(syncPromises);
    });
  });
}

// PUSH NOTIFICATIONS: Completely fixed implementation
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  // Parse the push data
  let data = { 
    title: 'New Notification', 
    message: 'You have a new notification',
    url: '/'
  };

  try {
    if (event.data) {
      // Try to parse as JSON first
      try {
        data = JSON.parse(event.data.text());
        console.log('[SW] Push data:', data);
      } catch (e) {
        // If not valid JSON, use the text as the message
        const text = event.data.text();
        console.log('[SW] Push text (not JSON):', text);
        data = {
          title: 'New Notification',
          message: text,
          url: '/'
        };
      }
    }
  } catch (e) {
    console.warn('[SW] Error processing push data, using default:', e);
  }

  // Always store the notification first (this works without permission)
  event.waitUntil(
    storeNotificationForLater(data)
      .then(() => {
        console.log('[SW] Notification stored successfully, now notifying clients');
        // Notify all clients about the new notification so they can request permission and show it
        return self.clients.matchAll()
          .then(clients => {
            if (clients.length > 0) {
              // Send message to clients to check for new notifications
              clients.forEach(client => {
                client.postMessage({
                  type: 'NEW_PUSH_NOTIFICATION',
                  notification: data,
                  timestamp: new Date().toISOString()
                });
              });
              console.log('[SW] Notified', clients.length, 'clients about new notification');
            } else {
              console.log('[SW] No active clients to notify about new notification');
              // Try to deliver pending notifications next time a client connects
            }
          });
      })
      .catch(err => {
        console.error('[SW] Failed to handle push notification:', err);
      })
  );
});

// Store notification for later delivery
function storeNotificationForLater(data) {
  return getDB().then(db => {
    // Check if the notifications store exists
    if (!db.objectStoreNames.contains('notifications')) {
      // We need to close the database and reopen it to create a new object store
      db.close();
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, db.version + 1);
        
        request.onupgradeneeded = event => {
          const upgradedDb = event.target.result;
          if (!upgradedDb.objectStoreNames.contains('notifications')) {
            upgradedDb.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
            console.log('[SW] Created notifications store during push handling');
          }
        };
        
        request.onerror = event => {
          console.error('[SW] Error upgrading database:', event.target.error);
          reject(event.target.error);
        };
        
        request.onsuccess = event => {
          const upgradedDb = event.target.result;
          resolve(upgradedDb);
        };
      }).then(upgradedDb => {
        // Now we can use the newly created store
        return new Promise((resolve, reject) => {
          const tx = upgradedDb.transaction('notifications', 'readwrite');
          const store = tx.objectStore('notifications');
          
          const request = store.add({
            data: data,
            timestamp: Date.now(),
            delivered: false
          });
          
          request.onsuccess = () => {
            console.log('[SW] Notification stored for later delivery');
            resolve();
          };
          
          request.onerror = (event) => {
            console.error('[SW] Error adding notification:', event.target.error);
            reject(event.target.error);
          };
          
          tx.oncomplete = () => {
            console.log('[SW] Transaction completed successfully');
          };
          
          tx.onerror = (event) => {
            console.error('[SW] Transaction error:', event.target.error);
          };
        });
      });
    } else {
      // Store exists, proceed normally
      return new Promise((resolve, reject) => {
        const tx = db.transaction('notifications', 'readwrite');
        const store = tx.objectStore('notifications');
        
        const request = store.add({
          data: data,
          timestamp: Date.now(),
          delivered: false
        });
        
        request.onsuccess = () => {
          console.log('[SW] Notification stored for later delivery');
          resolve();
        };
        
        request.onerror = (event) => {
          console.error('[SW] Error adding notification:', event.target.error);
          reject(event.target.error);
        };
        
        tx.oncomplete = () => {
          console.log('[SW] Transaction completed successfully');
        };
        
        tx.onerror = (event) => {
          console.error('[SW] Transaction error:', event.target.error);
        };
      });
    }
  }).catch(err => {
    console.error('[SW] Error storing notification:', err);
  });
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Default action is to open the specified URL
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is already open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received from client:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    console.log('[SW] Skip waiting and activating new version');
  } else if (event.data && event.data.type === 'CHECK_PENDING_NOTIFICATIONS') {
    console.log('[SW] Checking for pending notifications');
    deliverPendingNotifications();
  } else if (event.data && event.data.type === 'SIMULATE_PUSH') {
    console.log('[SW] Simulating push notification:', event.data.notification);
    // For simulated push, just store it - the client will handle showing it
    storeNotificationForLater(event.data.notification)
      .then(() => {
        console.log('[SW] Simulated push notification stored successfully');
        // Notify the client that sent the message
        if (event.source) {
          event.source.postMessage({
            type: 'NOTIFICATION_STORED',
            notification: event.data.notification,
            timestamp: new Date().toISOString()
          });
        }
      })
      .catch(err => {
        console.error('[SW] Failed to store simulated push notification:', err);
      });
  } else if (event.data && event.data.type === 'PERMISSION_GRANTED') {
    console.log('[SW] Permission granted, delivering pending notifications');
    deliverPendingNotifications();
  }
});

// Deliver any pending notifications
function deliverPendingNotifications() {
  getDB().then(db => {
    // Check if the notifications store exists
    if (!db.objectStoreNames.contains('notifications')) {
      console.log('[SW] No notifications store exists yet');
      return;
    }
    
    const tx = db.transaction('notifications', 'readwrite');
    const store = tx.objectStore('notifications');
    
    // Properly handle the IDBRequest
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      const notifications = event.target.result;
      console.log('[SW] Found pending notifications:', notifications.length);
      
      if (notifications.length === 0) return;
      
      // Try to deliver each notification
      notifications.forEach(notification => {
        self.registration.showNotification(
          notification.data.title, 
          {
            body: notification.data.message || notification.data.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            data: notification.data
          }
        ).then(() => {
          // Mark as delivered
          const deleteTx = db.transaction('notifications', 'readwrite');
          const deleteStore = deleteTx.objectStore('notifications');
          const deleteRequest = deleteStore.delete(notification.id);
          
          deleteRequest.onsuccess = () => {
            console.log('[SW] Delivered pending notification:', notification.id);
          };
          
          deleteRequest.onerror = (event) => {
            console.error('[SW] Failed to delete delivered notification:', event.target.error);
          };
        }).catch(err => {
          console.error('[SW] Failed to deliver pending notification:', err);
        });
      });
    };
    
    request.onerror = (event) => {
      console.error('[SW] Error getting notifications:', event.target.error);
    };
  }).catch(err => {
    console.error('[SW] Error checking pending notifications:', err);
  });
}
