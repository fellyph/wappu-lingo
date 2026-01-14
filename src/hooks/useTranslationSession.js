import { useState, useCallback, useRef } from 'react';
import { fetchSessionStrings, normalizeString } from '../services/glotpress';
import { submitTranslation as persistTranslation } from '../services/translations';

export function useTranslationSession() {
  const [strings, setStrings] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    completed: 0,
    skipped: 0,
  });

  // Store session context for API calls
  const sessionContext = useRef({
    projectSlug: null,
    projectName: null,
    locale: null,
    userId: null,
    userEmail: null,
  });

  /**
   * Start a new translation session
   * @param {Object} options - Session options
   * @param {string} options.projectSlug - Project slug (e.g., 'wp/dev')
   * @param {string} options.projectName - Project display name
   * @param {string} options.localeSlug - Locale code (e.g., 'pt-br')
   * @param {number} options.sampleSize - Number of strings to fetch
   * @param {string} options.userId - User's unique ID
   * @param {string} options.userEmail - User's email
   */
  const startSession = useCallback(async (options) => {
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
      setError(err.message || 'Failed to load strings');
      setStrings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get current string to translate
   */
  const currentString = strings[currentIndex] || null;

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
   */
  const submitTranslation = useCallback(
    async (translation) => {
      const ctx = sessionContext.current;

      // Persist to database (fire and forget, don't block UI)
      if (ctx.userId && currentString) {
        persistTranslation({
          user_id: ctx.userId,
          user_email: ctx.userEmail,
          project_slug: ctx.projectSlug,
          project_name: ctx.projectName,
          locale: ctx.locale,
          original_id: currentString.id,
          original_string: currentString.singular,
          translation: translation,
          context: currentString.context,
          status: 'pending',
        }).catch((err) => {
          console.error('Failed to persist translation:', err);
        });
      }

      setSessionStats((prev) => ({ ...prev, completed: prev.completed + 1 }));
      setCurrentIndex((prev) => prev + 1);
    },
    [currentString]
  );

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
