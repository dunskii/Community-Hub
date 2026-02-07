import './styles/app.css';

// Initialize i18n BEFORE rendering React
import './i18n/config';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { initializeMapbox } from './services/maps/mapbox-config.js';
import { loadAndInjectDesignTokens } from './utils/design-tokens';

// Initialize Mapbox GL JS before rendering
const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
if (mapboxToken) {
  initializeMapbox(mapboxToken);
} else {
  console.warn('VITE_MAPBOX_ACCESS_TOKEN not set - maps will not work');
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found in document');
}

// Load design tokens before rendering
loadAndInjectDesignTokens().then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
