import React, { useState, useEffect } from 'react';
import { 
  subscribeToPushNotifications, 
  updateServiceWorker,
  checkPendingNotifications
} from '../serviceWorkerRegistration';
import '../styles/push-notification-demo.css';

// Helper function to request notification permission
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return { granted: false, reason: 'Notifications not supported' };
  }
  
  try {
    const permission = await Notification.requestPermission();
    return { granted: permission === 'granted', reason: permission };
  } catch (error) {
    return { granted: false, reason: error.message };
  }
};

function PushNotificationDemo() {
  const [status, setStatus] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [notificationData, setNotificationData] = useState({
    title: 'Test Notification',
    message: 'This is a test notification'
  });

  // Check permission status on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      const messageHandler = (event) => {
        console.log('Message from SW:', event.data);
        
        if (event.data && event.data.type === 'NEW_PUSH_NOTIFICATION') {
          setStatus(`New notification received: ${JSON.stringify(event.data.notification)}`);
          
          // If we have permission, show the notification from the client side
          if (Notification.permission === 'granted') {
            showNotificationFromClient(event.data.notification);
            // Tell the service worker that permission is granted
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'PERMISSION_GRANTED'
              });
            }
          } else {
            // Ask for permission
            requestPermissionAndShowNotifications();
          }
        } else if (event.data && event.data.type === 'NOTIFICATION_STORED') {
          setStatus(`Notification stored: ${JSON.stringify(event.data.notification)}`);
          // Try to show it if we have permission
          if (Notification.permission === 'granted') {
            showNotificationFromClient(event.data.notification);
          } else {
            // Ask for permission
            requestPermissionAndShowNotifications();
          }
        }
      };
      
      navigator.serviceWorker.addEventListener('message', messageHandler);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      };
    }
  }, []);
  
  // Function to show notification from the client side
  const showNotificationFromClient = (notificationData) => {
    if (!('Notification' in window)) {
      setStatus('Notifications not supported in this browser');
      return;
    }
    
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(notificationData.title, {
          body: notificationData.message || notificationData.body,
          icon: '/icons/icon-192x192.png'
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        setStatus(`Showing notification: ${notificationData.title}`);
      } catch (error) {
        setStatus(`Error showing notification: ${error.message}`);
      }
    }
  };
  
  // Request permission and show pending notifications
  const requestPermissionAndShowNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermissionStatus(result.granted ? 'granted' : 'denied');
    
    if (result.granted) {
      setStatus('Notification permission granted, checking for pending notifications');
      // Tell the service worker that permission is granted
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PERMISSION_GRANTED'
        });
      }
      checkPendingNotifications();
    } else {
      setStatus(`Notification permission denied: ${result.reason}`);
    }
  };

  const handleRequestPermission = async () => {
    setStatus('Requesting notification permission...');
    const result = await requestPermissionAndShowNotifications();
    setPermissionStatus(Notification.permission);
  };

  const handleSubscribe = async () => {
    try {
      setStatus('Requesting permission...');
      const sub = await subscribeToPushNotifications();
      setSubscription(sub);
      setPermissionStatus(Notification.permission);
      setStatus('Subscribed to push notifications!');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleUpdateServiceWorker = () => {
    setStatus('Updating service worker...');
    updateServiceWorker();
  };

  const handleCheckNotifications = () => {
    setStatus('Checking for pending notifications...');
    checkPendingNotifications();
  };

  const handleSendTestPush = async () => {
    // In a real app, this would be sent to your server
    // Here we're simulating a push by directly triggering the service worker
    setStatus('Sending test push notification...');
    
    try {
      if (navigator.serviceWorker.controller) {
        // Simulate a push event by sending a message to the service worker
        navigator.serviceWorker.controller.postMessage({
          type: 'SIMULATE_PUSH',
          notification: notificationData
        });
        setStatus('Test push sent to service worker');
      } else {
        setStatus('No active service worker to send push to');
      }
    } catch (error) {
      setStatus(`Error sending test push: ${error.message}`);
    }
  };
  
  const handleShowNotification = () => {
    if (Notification.permission !== 'granted') {
      setStatus('Please request notification permission first');
      return;
    }
    
    showNotificationFromClient(notificationData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNotificationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="push-notification-demo">
      <h2>Push Notification Demo</h2>
      
      <div className="status-box">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Notification Permission:</strong> {permissionStatus}</p>
      </div>
      
      <div className="button-group">
        <button onClick={handleUpdateServiceWorker}>
          Update Service Worker
        </button>
        
        <button onClick={handleRequestPermission}>
          Request Notification Permission
        </button>
        
        <button onClick={handleSubscribe}>
          Subscribe to Push Notifications
        </button>
        
        <button onClick={handleCheckNotifications}>
          Check Pending Notifications
        </button>
      </div>
      
      <div className="test-push-section">
        <h3>Test Notifications</h3>
        <div className="form-group">
          <label>
            Title:
            <input 
              type="text" 
              name="title" 
              value={notificationData.title}
              onChange={handleInputChange}
            />
          </label>
        </div>
        <div className="form-group">
          <label>
            Message:
            <input 
              type="text" 
              name="message" 
              value={notificationData.message}
              onChange={handleInputChange}
            />
          </label>
        </div>
        <div className="notification-buttons">
          <button onClick={handleSendTestPush}>
            Send Test Push
          </button>
          <button onClick={handleShowNotification} disabled={permissionStatus !== 'granted'}>
            Show Direct Notification
          </button>
        </div>
      </div>
      
      <div className="subscription-info">
        <h3>Subscription Info</h3>
        {subscription ? (
          <pre>{JSON.stringify(subscription, null, 2)}</pre>
        ) : (
          <p>Not subscribed yet</p>
        )}
      </div>
    </div>
  );
}

export default PushNotificationDemo;
