import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import PWAUpdatePrompt from './pwa/PWAUpdatePrompt';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PWAUpdatePrompt />
      <App />
    </BrowserRouter>
  </StrictMode>
);
