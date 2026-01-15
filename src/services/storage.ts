const STORAGE_KEYS = {
  LOCALE: 'wappu_locale',
  PROJECT: 'wappu_project',
  STRINGS_PER_SESSION: 'wappu_strings_per_session',
  UI_LANGUAGE: 'wappu_ui_language',
} as const;

interface StorageService {
  getLocale: () => string;
  setLocale: (locale: string) => void;
  getProject: () => string;
  setProject: (project: string) => void;
  getStringsPerSession: () => number;
  setStringsPerSession: (count: number) => void;
  getUILanguage: () => string | null;
  setUILanguage: (language: string) => void;
}

export const storage: StorageService = {
  getLocale: () => localStorage.getItem(STORAGE_KEYS.LOCALE) || 'pt-br',
  setLocale: (locale: string) => localStorage.setItem(STORAGE_KEYS.LOCALE, locale),

  getProject: () => localStorage.getItem(STORAGE_KEYS.PROJECT) || 'wp-core',
  setProject: (project: string) => localStorage.setItem(STORAGE_KEYS.PROJECT, project),

  getStringsPerSession: () => {
    const val = localStorage.getItem(STORAGE_KEYS.STRINGS_PER_SESSION);
    return val ? parseInt(val, 10) : 10;
  },
  setStringsPerSession: (count: number) =>
    localStorage.setItem(STORAGE_KEYS.STRINGS_PER_SESSION, count.toString()),

  getUILanguage: () => localStorage.getItem(STORAGE_KEYS.UI_LANGUAGE),
  setUILanguage: (language: string) =>
    localStorage.setItem(STORAGE_KEYS.UI_LANGUAGE, language),
};
