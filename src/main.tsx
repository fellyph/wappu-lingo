import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';
import i18n, { getLanguageDir } from './i18n';

// Set initial document direction based on detected/stored language
document.documentElement.dir = getLanguageDir(i18n.language);
document.documentElement.lang = i18n.language;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
