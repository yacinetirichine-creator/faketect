import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/index.css';
import './i18n';

// Initialiser Sentry en premier (monitoring optionnel)
import { initSentry } from './config/sentry';
initSentry();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', borderRadius: '12px' } }} />
    </BrowserRouter>
  </React.StrictMode>
);
