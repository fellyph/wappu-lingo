const STORAGE_KEYS = {
  LOCALE: 'wapuu_locale',
  PROJECT: 'wapuu_project',
  STRINGS_PER_SESSION: 'wapuu_strings_per_session',
  UI_LANGUAGE: 'wapuu_ui_language',
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

// Safe localStorage wrapper - handles private browsing and quota errors
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silently fail - user preferences won't persist but app still works
  }
}

export const storage: StorageService = {
  getLocale: () => safeGetItem(STORAGE_KEYS.LOCALE) || 'pt-br',
  setLocale: (locale: string) => safeSetItem(STORAGE_KEYS.LOCALE, locale),

  getProject: () => safeGetItem(STORAGE_KEYS.PROJECT) || 'wp-core',
  setProject: (project: string) => safeSetItem(STORAGE_KEYS.PROJECT, project),

  getStringsPerSession: () => {
    const val = safeGetItem(STORAGE_KEYS.STRINGS_PER_SESSION);
    return val ? parseInt(val, 10) : 10;
  },
  setStringsPerSession: (count: number) =>
    safeSetItem(STORAGE_KEYS.STRINGS_PER_SESSION, count.toString()),

  getUILanguage: () => safeGetItem(STORAGE_KEYS.UI_LANGUAGE),
  setUILanguage: (language: string) =>
    safeSetItem(STORAGE_KEYS.UI_LANGUAGE, language),
};
