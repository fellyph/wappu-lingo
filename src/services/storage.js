const STORAGE_KEYS = {
  LOCALE: 'wappu_locale',
  PROJECT: 'wappu_project',
  STRINGS_PER_SESSION: 'wappu_strings_per_session',
};

export const storage = {
  getLocale: () => localStorage.getItem(STORAGE_KEYS.LOCALE) || 'pt-br',
  setLocale: (locale) => localStorage.setItem(STORAGE_KEYS.LOCALE, locale),

  getProject: () => localStorage.getItem(STORAGE_KEYS.PROJECT) || 'wp-core',
  setProject: (project) => localStorage.setItem(STORAGE_KEYS.PROJECT, project),

  getStringsPerSession: () => {
    const val = localStorage.getItem(STORAGE_KEYS.STRINGS_PER_SESSION);
    return val ? parseInt(val, 10) : 10;
  },
  setStringsPerSession: (count) =>
    localStorage.setItem(STORAGE_KEYS.STRINGS_PER_SESSION, count.toString()),
};
