import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchSessionStrings, normalizeString } from '../services/glotpress';
import { submitTranslation as persistTranslation } from '../services/translations';
import type {
  TranslationString,
  SessionStats,
  SessionContext,
  StartSessionOptions,
  UseTranslationSessionReturn,
} from '../types';

export function useTranslationSession(): UseTranslationSessionReturn {
  const [strings, setStrings] = useState<TranslationString[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    total: 0,
    completed: 0,
    skipped: 0,
  });

  // Store session context for API calls
  const sessionContext = useRef<SessionContext>({
    projectSlug: null,
    projectName: null,
    locale: null,
    userId: null,
    userEmail: null,
  });

  // Ref for currentString to enable stable callback
  const currentStringRef = useRef<TranslationString | null>(null);

  /**
   * Start a new translation session
   */
  const startSession = useCallback(async (options: StartSessionOptions) => {
    const { projectSlug, projectName, localeSlug, sampleSize, userId, userEmail } = options;

    // Store context for later API calls
    sessionContext.current = {
      projectSlug,
      projectName,
      locale: localeSlug,
      userId,
      userEmail,
    };

    setIsLoading(true);
    setError(null);
    setCurrentIndex(0);
    setSessionStats({ total: 0, completed: 0, skipped: 0 });

    try {
      const rawStrings = await fetchSessionStrings(projectSlug, localeSlug, sampleSize);
      const normalized = rawStrings.map(normalizeString);
      setStrings(normalized);
      setSessionStats((prev) => ({ ...prev, total: normalized.length }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load strings';
      setError(errorMessage);
      setStrings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get current string to translate
   */
  const currentString = strings[currentIndex] || null;

  // Keep ref in sync for stable callback
  useEffect(() => {
    currentStringRef.current = currentString;
  }, [currentString]);

  /**
   * Check if session is complete
   */
  const isSessionComplete = currentIndex >= strings.length && strings.length > 0;

  /**
   * Progress percentage
   */
  const progressPercent =
    strings.length > 0 ? Math.round((currentIndex / strings.length) * 100) : 0;

  /**
   * Move to next string after translation submitted
   * Persists the translation to the database
   * Uses ref pattern for stable callback - prevents child re-renders
   */
  const submitTranslation = useCallback(async (translation: string) => {
    const ctx = sessionContext.current;
    const current = currentStringRef.current;

    // Persist to database (fire and forget, don't block UI)
    if (ctx.userId && ctx.projectSlug && ctx.locale && current) {
      persistTranslation({
        user_id: ctx.userId,
        user_email: ctx.userEmail,
        project_slug: ctx.projectSlug,
        project_name: ctx.projectName,
        locale: ctx.locale,
        original_id: current.id,
        original_string: current.singular,
        translation: translation,
        context: current.context,
        status: 'pending',
      }).catch((err) => {
        console.error('Failed to persist translation:', err);
      });
    }

    setSessionStats((prev) => ({ ...prev, completed: prev.completed + 1 }));
    setCurrentIndex((prev) => prev + 1);
  }, []);

  /**
   * Skip current string
   */
  const skipString = useCallback(() => {
    setSessionStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
    setCurrentIndex((prev) => prev + 1);
  }, []);

  /**
   * Reset session
   */
  const resetSession = useCallback(() => {
    setStrings([]);
    setCurrentIndex(0);
    setError(null);
    setSessionStats({ total: 0, completed: 0, skipped: 0 });
  }, []);

  return {
    strings,
    currentString,
    currentIndex,
    isLoading,
    error,
    isSessionComplete,
    progressPercent,
    sessionStats,
    startSession,
    submitTranslation,
    skipString,
    resetSession,
  };
}
