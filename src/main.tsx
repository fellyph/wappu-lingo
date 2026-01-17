import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './context/AuthContext';
import { TranslationSessionProvider } from './context/TranslationSessionContext';
import './index.css';
import './i18n';
import i18n, { getLanguageDir } from './i18n';

// Extract OAuth token from URL hash BEFORE mounting React
// This ensures the token is saved before the router processes the URL
function extractOAuthToken(): void {
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    if (accessToken) {
      localStorage.setItem('gravatar_token', accessToken);
      // Clean the URL by removing the hash
      window.history.replaceState(null, '', window.location.pathname);
    }
  }
}

// Run OAuth extraction before React mounts
extractOAuthToken();

// Set initial document direction based on detected/stored language
document.documentElement.dir = getLanguageDir(i18n.language);
document.documentElement.lang = i18n.language;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <TranslationSessionProvider>
        <RouterProvider router={router} />
      </TranslationSessionProvider>
    </AuthProvider>
  </React.StrictMode>
);
