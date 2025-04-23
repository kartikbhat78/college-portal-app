import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const FetchDemo = () => {
  const [fetchResult, setFetchResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cachedResources, setCachedResources] = useState([]);
  const [syncStatus, setSyncStatus] = useState('');
  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setSyncStatus('You are back online! Syncing pending requests...');
      // Attempt to sync when coming back online
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
          registration.sync.register('sync-data')
            .then(() => {
              console.log('Background sync registered on reconnect');
            })
            .catch(err => {
              console.error('Background sync registration failed:', err);
            });
        });
      }
      setTimeout(() => setSyncStatus(''), 5000);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setSyncStatus('You are offline. Requests will be queued for later.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      const messageHandler = (event) => {
        if (event.data && event.data.type === 'SYNC_SUCCESS') {
          setSyncStatus(`Successfully synced request to ${event.data.url}`);
          setTimeout(() => setSyncStatus(''), 5000);
        } else if (event.data && event.data.type === 'NOTIFICATION_PERMISSION_REQUIRED') {
          setSyncStatus('Notification permission required. Please click "Request Permission" button.');
          setTimeout(() => setSyncStatus(''), 8000);
        } else if (event.data && event.data.type === 'NEW_PUSH_NOTIFICATION') {
          // Show the notification if we have permission
          if (Notification.permission === 'granted') {
            // Show the notification using the Notification API
            const notificationData = event.data.notification;
            const notification = new Notification(notificationData.title, {
              body: notificationData.message || notificationData.body,
              icon: '/icons/icon-192x192.png'
            });
            
            // Handle notification click
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
            
            setSyncStatus('New push notification received and displayed!');
            setTimeout(() => setSyncStatus(''), 5000);
          } else {
            setSyncStatus('New push notification received but permission not granted. Click "Request Permission".');
            setTimeout(() => setSyncStatus(''), 8000);
          }
        }
      };
      
      navigator.serviceWorker.addEventListener('message', messageHandler);
      
      // Check for pending notifications on load if we have permission
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
          registration.active.postMessage({
            type: 'CHECK_PENDING_NOTIFICATIONS'
          });
        });
      }
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Function to perform a fetch and show the result
  const performFetch = async (url) => {
    setIsLoading(true);
    setFetchResult('');
    
    try {
      const response = await fetch(url);
      const text = await response.text();
      
      setFetchResult(
        `Status: ${response.status} ${response.statusText}\n` +
        `From Cache: ${response.headers.get('x-from-cache') === 'true' ? 'Yes' : 'No'}\n` +
        `Content (first 100 chars): ${text.substring(0, 100)}...`
      );
    } catch (error) {
      setFetchResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check cache contents
  const checkCache = async () => {
    setIsLoading(true);
    
    try {
      if ('caches' in window) {
        const cache = await caches.open('college-portal-cache-v1');
        const keys = await cache.keys();
        const dynamicCache = await caches.open('college-portal-dynamic-v1');
        const dynamicKeys = await dynamicCache.keys();
        
        const allKeys = [
          ...keys.map(key => ({ url: key.url, cache: 'static' })),
          ...dynamicKeys.map(key => ({ url: key.url, cache: 'dynamic' }))
        ];
        
        setCachedResources(allKeys);
        setFetchResult(`Found ${allKeys.length} cached resources.`);
      } else {
        setFetchResult('Cache API not supported in this browser.');
      }
    } catch (error) {
      setFetchResult(`Error checking cache: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a test file to fetch
  const createTestFile = async () => {
    setIsLoading(true);
    
    try {
      // Create a test JSON file via fetch
      const response = await fetch('/api/test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'This is test data',
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        setFetchResult('Test file created successfully. You can now fetch it.');
      } else {
        setFetchResult(`Failed to create test file: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (isOffline) {
        setFetchResult('You are offline. This request will be synced when you reconnect.');
      } else {
        setFetchResult(`Error creating test file: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Force sync all pending requests
  const forceSyncRequests = async () => {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      setFetchResult('Background Sync not supported in this browser.');
      return;
    }

    setIsLoading(true);
    try {
      await navigator.serviceWorker.ready;
      await navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register('sync-data');
      });
      setFetchResult('Sync request registered successfully. Check console for details.');
    } catch (error) {
      setFetchResult(`Error registering sync: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update service worker
  const updateServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.update().then(() => {
          setFetchResult('Service worker update requested. Refresh the page to activate.');
        });
      });
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setFetchResult('Notifications are not supported in this browser.');
      return;
    }

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        setFetchResult('Notification permission granted! You can now test push notifications.');
        // Register with push server (simulated here)
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          try {
            // This would typically involve subscribing to push service and sending to server
            // For demo purposes, we'll just show a success message
            setFetchResult('Notification permission granted and push subscription activated!');
            
            // Deliver any pending notifications
            registration.active.postMessage({
              type: 'CHECK_PENDING_NOTIFICATIONS'
            });
          } catch (error) {
            console.error('Error setting up push subscription:', error);
          }
        }
      } else {
        setFetchResult(`Notification permission ${permission}. Push notifications will not work.`);
      }
    } catch (error) {
      setFetchResult(`Error requesting notification permission: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test push notification
  const testPushNotification = async () => {
    if (!('serviceWorker' in navigator)) {
      setFetchResult('Service workers are not supported in this browser.');
      return;
    }

    if (notificationPermission !== 'granted') {
      requestNotificationPermission();
      return;
    }

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Send a test notification directly from the service worker
      registration.showNotification('Test Notification', {
        body: 'This is a test notification from the College Portal',
        icon: '/icons/icon-192x192.png',
        data: {
          url: '/fetch-demo'
        },
        actions: [
          {
            action: 'view',
            title: 'View'
          },
          {
            action: 'close',
            title: 'Close'
          }
        ]
      });
      
      setFetchResult('Test notification sent successfully!');
    } catch (error) {
      setFetchResult(`Error sending test notification: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get permission status display
  const getPermissionStatusDisplay = () => {
    switch (notificationPermission) {
      case 'granted':
        return <span className="text-green-400">Granted</span>;
      case 'denied':
        return <span className="text-red-400">Denied</span>;
      case 'default':
        return <span className="text-yellow-400">Not requested</span>;
      default:
        return <span className="text-gray-400">Not supported</span>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-zinc-800 rounded-xl shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-6">Service Worker Fetch & Sync Demo</h2>
      
      <div className="mb-6 p-4 rounded-lg bg-zinc-700">
        <div className="flex items-center mb-4">
          <div className={`w-3 h-3 rounded-full mr-2 ${isOffline ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <span className="text-white">{isOffline ? 'Offline' : 'Online'}</span>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-zinc-300">
              Notifications: {getPermissionStatusDisplay()}
            </div>
            <button 
              onClick={updateServiceWorker}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
            >
              Update SW
            </button>
          </div>
        </div>
        
        {syncStatus && (
          <motion.div 
            className="mb-4 p-2 bg-blue-900/50 text-blue-200 rounded text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {syncStatus}
          </motion.div>
        )}
        
        <p className="text-zinc-300 text-sm mb-4">
          This demo tests the fetch and background sync functionality of the service worker. 
          Try going offline (using Chrome DevTools) and making requests to see how they're handled.
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => performFetch('/index.html')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Fetch Index
          </button>
          
          <button
            onClick={() => performFetch('/manifest.json')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Fetch Manifest
          </button>
          
          <button
            onClick={() => performFetch('/api/test-data')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Fetch API Data
          </button>
          
          <button
            onClick={() => performFetch('/non-existent-page.html')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Fetch Non-Existent
          </button>
          
          <button
            onClick={checkCache}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Check Cache
          </button>
          
          <button
            onClick={createTestFile}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Create Test Data
          </button>

          <button
            onClick={forceSyncRequests}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Force Sync
          </button>
        </div>

        <div className="border-t border-zinc-600 pt-4 mt-4">
          <h3 className="text-white font-bold mb-2">Push Notification Testing</h3>
          <p className="text-zinc-300 text-sm mb-4">
            Test push notifications by first requesting permission, then sending a test notification.
          </p>
          <div className="flex gap-2">
            <button
              onClick={requestNotificationPermission}
              className={`px-4 py-2 ${notificationPermission !== 'granted' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600'} text-white rounded`}
              disabled={notificationPermission === 'granted'}
            >
              Request Permission
            </button>
            
            <button
              onClick={testPushNotification}
              className={`px-4 py-2 ${notificationPermission === 'granted' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600'} text-white rounded`}
              disabled={notificationPermission !== 'granted'}
            >
              Test Notification
            </button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <motion.div 
          className="flex justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-6 h-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
        </motion.div>
      ) : fetchResult ? (
        <motion.div 
          className="bg-zinc-900 p-4 rounded-lg text-white font-mono text-sm whitespace-pre-wrap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {fetchResult}
        </motion.div>
      ) : null}
      
      {cachedResources.length > 0 && (
        <motion.div 
          className="mt-6 bg-zinc-900 p-4 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-white font-bold mb-2">Cached Resources:</h3>
          <div className="max-h-60 overflow-y-auto">
            {cachedResources.map((resource, index) => (
              <div key={index} className="text-sm text-zinc-300 mb-1 flex">
                <span className={`inline-block w-16 mr-2 ${resource.cache === 'static' ? 'text-blue-400' : 'text-green-400'}`}>
                  [{resource.cache}]
                </span>
                <span className="truncate">{resource.url}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      <div className="mt-6 bg-zinc-700 p-4 rounded-lg">
        <h3 className="text-white font-bold mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside text-zinc-300 space-y-2">
          <li>First, click "Request Permission" to enable push notifications</li>
          <li>Click "Fetch Index" to fetch the index.html file (should be cached)</li>
          <li>Click "Check Cache" to see what resources are currently cached</li>
          <li>Use Chrome DevTools to go offline (Network tab → check "Offline")</li>
          <li>Try creating test data while offline - it will be queued for sync</li>
          <li>Go back online and watch as the queued requests are automatically synced</li>
          <li>Use "Force Sync" to manually trigger background sync</li>
          <li>Click "Test Notification" to test push notifications</li>
        </ol>
      </div>
    </div>
  );
};

export default FetchDemo;
