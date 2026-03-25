import './styles/app.css';

// Initialize i18n BEFORE rendering React
import './i18n/config';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';

import { App } from './App';
import { initializeMapbox } from './services/maps/mapbox-config.js';
import { loadAndInjectDesignTokens } from './utils/design-tokens';
import { loadPlatformConfig } from './config/platform-loader';
import { initializeTheme } from './hooks/useTheme';

// Initialize theme BEFORE React renders to prevent flash of unstyled content
// This applies the .dark class immediately based on stored preference or system setting
initializeTheme();

// Initialize Mapbox GL JS before rendering
const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
if (mapboxToken) {
  initializeMapbox(mapboxToken);
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found in document');
}

// Load platform config with retries (backend may still be starting)
async function loadConfigWithRetry(retries = 5, delayMs = 1000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await loadPlatformConfig();
      return;
    } catch {
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  console.error('Failed to load platform config after retries — backend may be down');
}

// Load platform config and design tokens before rendering
Promise.all([
  loadConfigWithRetry(),
  loadAndInjectDesignTokens(),
]).then(() => {
  createRoot(root).render(
    <StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </StrictMode>,
  );
});
