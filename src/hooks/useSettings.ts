import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { storage } from '../services/storage';
import { PROJECTS } from '../constants/projects';
import { LOCALES } from '../constants/locales';
import { UI_LANGUAGES, getLanguageDir } from '../i18n';
import type { UseSettingsReturn } from '../types';

export function useSettings(): UseSettingsReturn {
  const { i18n } = useTranslation();
  const [locale, setLocaleState] = useState(() => storage.getLocale());
  const [projectId, setProjectIdState] = useState(() => storage.getProject());
  const [stringsPerSession, setStringsPerSessionState] = useState(() =>
    storage.getStringsPerSession()
  );

  const setLocale = useCallback((newLocale: string) => {
    storage.setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const setProject = useCallback((newProjectId: string) => {
    storage.setProject(newProjectId);
    setProjectIdState(newProjectId);
  }, []);

  const setStringsPerSession = useCallback((count: number) => {
    storage.setStringsPerSession(count);
    setStringsPerSessionState(count);
  }, []);

  const setUILanguage = useCallback(
    (langCode: string) => {
      i18n.changeLanguage(langCode);
      storage.setUILanguage(langCode);
      // Update document direction for RTL support
      document.documentElement.dir = getLanguageDir(langCode);
      document.documentElement.lang = langCode;
    },
    [i18n]
  );

  // Derived: get full project object
  const project = PROJECTS.find((p) => p.id === projectId) || PROJECTS[0];

  // Derived: get full locale object
  const localeObj = LOCALES.find((l) => l.code === locale) || LOCALES[0];

  return {
    locale,
    localeObj,
    setLocale,
    projectId,
    project,
    setProject,
    stringsPerSession,
    setStringsPerSession,
    availableProjects: PROJECTS,
    availableLocales: LOCALES,
    uiLanguage: i18n.language,
    setUILanguage,
    availableUILanguages: UI_LANGUAGES,
  };
}
