import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import en from './locales/en.json';
import ptBR from './locales/pt-BR.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ar from './locales/ar.json';
import nl from './locales/nl.json';

export const UI_LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' as const },
  { code: 'pt-BR', name: 'Português (Brasil)', dir: 'ltr' as const },
  { code: 'es', name: 'Español', dir: 'ltr' as const },
  { code: 'fr', name: 'Français', dir: 'ltr' as const },
  { code: 'de', name: 'Deutsch', dir: 'ltr' as const },
  { code: 'it', name: 'Italiano', dir: 'ltr' as const },
  { code: 'ja', name: '日本語', dir: 'ltr' as const },
  { code: 'ar', name: 'العربية', dir: 'rtl' as const },
  { code: 'nl', name: 'Nederlands', dir: 'ltr' as const },
] as const;

export type UILanguageCode = (typeof UI_LANGUAGES)[number]['code'];
export type UILanguage = (typeof UI_LANGUAGES)[number];

const resources = {
  en: { translation: en },
  'pt-BR': { translation: ptBR },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  ja: { translation: ja },
  ar: { translation: ar },
  nl: { translation: nl },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: UI_LANGUAGES.map((l) => l.code),

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'wapuu_ui_language',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;

// Helper to get language direction
export function getLanguageDir(code: string): 'ltr' | 'rtl' {
  const lang = UI_LANGUAGES.find((l) => l.code === code);
  return lang?.dir || 'ltr';
}

// Helper to get language by code
export function getLanguageByCode(code: string): UILanguage | undefined {
  return UI_LANGUAGES.find((l) => l.code === code);
}
