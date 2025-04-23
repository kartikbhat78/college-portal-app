import React, { useState, useEffect } from 'react';
import { requestBackgroundSync, subscribeToPushNotifications } from '../serviceWorkerRegistration';
import './ServiceWorkerDemo.css';

const ServiceWorkerDemo = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncSupported, setSyncSupported] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [formData, setFormData] = useState({ message: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Check for online/offline status
    const handleOnline = () => {
      setOnline(true);
      setStatus('You are back online! Any queued requests will sync automatically.');
      setTimeout(() => setStatus(''), 5000);
    };
    
    const handleOffline = () => {
      setOnline(false);
      setStatus('You are offline. Your requests will be queued for later.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check feature support
    const checkFeatureSupport = async () => {
      // Check background sync support
      const syncSupported = 'serviceWorker' in navigator && 'SyncManager' in window;
      setSyncSupported(syncSupported);

      // Check push notification support
      const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      setPushSupported(pushSupported);

      // Check current notification permission
      if (pushSupported && 'Notification' in window) {
        setPushPermission(Notification.permission);
      }
    };

    checkFeatureSupport();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!online) {
        // Store form data in IndexedDB for later sync
        await storeFormData(formData);
        
        // Register background sync if supported
        if (syncSupported) {
          try {
            await requestBackgroundSync('form-demo');
            setStatus('Form saved for sync when you go back online');
          } catch (error) {
            console.error('Background sync registration failed:', error);
            setStatus('Failed to register sync. Form data saved for later submission.');
          }
        } else {
          setStatus('Background sync not supported, but form data saved for later submission');
        }
      } else {
        // Online - submit directly
        await submitFormData(formData);
        setStatus('Form submitted successfully!');
        setFormData({ message: '' });
      }
    } catch (error) {
      console.error('Error handling form submission:', error);
      setStatus('Error: ' + error.message);
    }
  };

  const storeFormData = async (data) => {
    // Open IndexedDB
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('form-data-db', 1);
      
      request.onerror = (event) => reject(new Error('IndexedDB error'));
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('forms')) {
          db.createObjectStore('forms', { keyPath: 'id', autoIncrement: true });
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['forms'], 'readwrite');
        const store = transaction.objectStore('forms');
        
        const formWithTimestamp = { 
          ...data, 
          timestamp: new Date().toISOString(),
          synced: false
        };
        
        const storeRequest = store.add(formWithTimestamp);
        
        storeRequest.onsuccess = () => resolve();
        storeRequest.onerror = () => reject(new Error('Failed to store form data'));
      };
    });
  };

  const submitFormData = async (data) => {
    // In a real app, this would be an API endpoint
    return new Promise((resolve, reject) => {
      // Simulate API call
      setTimeout(() => {
        console.log('Form submitted:', data);
        resolve({ success: true });
      }, 1000);
    });
  };

  const testPushNotification = async () => {
    try {
      if (!pushSupported) {
        setStatus('Push notifications are not supported in this browser');
        return;
      }

      if (Notification.permission !== 'granted') {
        // Request permission and subscribe
        await subscribeToPushNotifications();
        setPushPermission(Notification.permission);
        setStatus('Successfully subscribed to push notifications!');
      } else {
        // Already have permission, simulate a push notification
        setStatus('Simulating a push notification...');
        
        // In a real app, this would come from your server
        // Here we're just simulating it locally
        setTimeout(() => {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Test Notification', {
              body: 'This is a test notification from your College Portal',
              icon: '/icons/icon-192x192.png',
              data: {
                url: '/service-worker-demo'
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
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Push notification error:', error);
      setStatus('Error: ' + error.message);
    }
  };

  return (
    <div className="service-worker-demo">
      <h2>Service Worker Features Demo</h2>
      
      <div className="status-panel">
        <div className={`status-indicator ${online ? 'online' : 'offline'}`}>
          {online ? 'Online' : 'Offline'}
        </div>
        
        <div className="feature-support">
          <div className={`feature ${syncSupported ? 'supported' : 'not-supported'}`}>
            Background Sync: {syncSupported ? 'Supported' : 'Not Supported'}
          </div>
          <div className={`feature ${pushSupported ? 'supported' : 'not-supported'}`}>
            Push Notifications: {pushSupported ? 'Supported' : 'Not Supported'}
          </div>
          {pushSupported && (
            <div className={`feature permission-${pushPermission}`}>
              Notification Permission: {pushPermission}
            </div>
          )}
        </div>
      </div>

      <div className="demo-section">
        <h3>Test Fetch & Background Sync</h3>
        <p>
          Submit this form while online or offline to test the service worker's fetch and sync capabilities.
          If you're offline, the data will be stored and sent when you reconnect.
        </p>
        
        <form onSubmit={handleSubmit} className="demo-form">
          <div className="form-group">
            <label htmlFor="message">Message:</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Enter a message to send"
              required
            />
          </div>
          <button type="submit" className="submit-btn">
            Submit Form {online ? '' : '(Will Sync Later)'}
          </button>
        </form>
      </div>

      <div className="demo-section">
        <h3>Test Push Notifications</h3>
        <p>
          Click the button below to test push notifications.
          {!pushSupported && " Unfortunately, your browser doesn't support push notifications."}
          {pushSupported && pushPermission !== 'granted' && " You'll need to grant permission first."}
        </p>
        
        <button 
          onClick={testPushNotification} 
          className="push-btn"
          disabled={!pushSupported}
        >
          {pushPermission === 'granted' 
            ? 'Send Test Notification' 
            : 'Request Notification Permission'}
        </button>
      </div>

      {status && (
        <div className="status-message">
          {status}
        </div>
      )}

      <div className="demo-section">
        <h3>Testing Instructions</h3>
        <ol>
          <li>
            <strong>Test Offline Mode:</strong> Open Chrome DevTools (F12), go to Network tab, 
            and check "Offline" to simulate being offline.
          </li>
          <li>
            <strong>Test Background Sync:</strong> While offline, submit the form. Then uncheck 
            "Offline" to go back online and watch the sync happen automatically.
          </li>
          <li>
            <strong>Test Push Notifications:</strong> Click the push notification button and 
            grant permission if asked.
          </li>
        </ol>
      </div>
    </div>
  );
};

export default ServiceWorkerDemo;
