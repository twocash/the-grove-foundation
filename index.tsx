import React from 'react';
import ReactDOM from 'react-dom/client';
// Global styles with Tailwind
import './styles/globals.css';
// Use the new router-enabled App from src/
import App from './src/App';
// v0.14.1: Shared state provider for NarrativeEngine
import { NarrativeEngineProvider } from './hooks/NarrativeEngineContext';
// v0.15: XState-based engagement state machine
import { EngagementProvider } from '@core/engagement';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <NarrativeEngineProvider>
      <EngagementProvider>
        <App />
      </EngagementProvider>
    </NarrativeEngineProvider>
  </React.StrictMode>
);