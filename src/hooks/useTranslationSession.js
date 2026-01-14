import { useState, useCallback } from 'react';
import { fetchSessionStrings, normalizeString } from '../services/glotpress';

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

  /**
   * Start a new translation session
   */
  const startSession = useCallback(async (projectSlug, localeSlug, sampleSize) => {
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
   */
  const submitTranslation = useCallback(
    (translation) => {
      console.log('Translation submitted:', {
        stringId: currentString?.id,
        translation,
      });

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
