import { useState, useCallback } from 'react';
import { storage } from '../services/storage';
import { PROJECTS } from '../constants/projects';
import { LOCALES } from '../constants/locales';

export function useSettings() {
  const [locale, setLocaleState] = useState(() => storage.getLocale());
  const [projectId, setProjectIdState] = useState(() => storage.getProject());
  const [stringsPerSession, setStringsPerSessionState] = useState(() =>
    storage.getStringsPerSession()
  );

  const setLocale = useCallback((newLocale) => {
    storage.setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const setProject = useCallback((newProjectId) => {
    storage.setProject(newProjectId);
    setProjectIdState(newProjectId);
  }, []);

  const setStringsPerSession = useCallback((count) => {
    storage.setStringsPerSession(count);
    setStringsPerSessionState(count);
  }, []);

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
  };
}
