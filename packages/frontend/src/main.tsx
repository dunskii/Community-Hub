import './styles/app.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { SkipLink } from './components/ui/index.js';

function App() {
  return (
    <>
      <SkipLink />
      <main id="main-content">
        <div>Community Hub</div>
      </main>
    </>
  );
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found in document');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
