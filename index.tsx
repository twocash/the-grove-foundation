import React from 'react';
import ReactDOM from 'react-dom/client';
// Global styles with Tailwind
import './styles/globals.css';
// Use the new router-enabled App from src/
import App from './src/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);