import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return <div>Community Hub</div>;
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
