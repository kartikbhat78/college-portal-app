// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';  // Correct import for React 18
import './index.css';
import App from './App';

// Use createRoot instead of render in React 18
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
