/**
 * React hook for WordPress Playground translation preview
 */

import { useState, useCallback } from 'react';
import type { TranslationForPreview, UsePlaygroundReturn } from '../types/playground';
import {
  generatePreviewURL,
  isPreviewSupported,
  mapLocaleToWPLocale,
} from '../services/playground';

interface UsePlaygroundOptions {
  projectSlug: string;
  locale: string;
  wpLocale?: string;
}

/**
 * Hook for managing WordPress Playground preview state
 *
 * @param options - Configuration options including project slug and locale
 * @returns Object with preview state and control functions
 *
 * @example
 * ```tsx
 * const { openPreview, isOpen, playgroundURL, closePreview } = usePlayground({
 *   projectSlug: 'wp-plugins/woocommerce/dev',
 *   locale: 'pt-br',
 * });
 *
 * // Open preview with current translations
 * openPreview([
 *   { original: 'Add to cart', translation: 'Adicionar ao carrinho' },
 * ]);
 * ```
 */
export function usePlayground(options: UsePlaygroundOptions): UsePlaygroundReturn {
  const { projectSlug, locale, wpLocale } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playgroundURL, setPlaygroundURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Open the Playground preview with the given translations
   */
  const openPreview = useCallback(
    (translations: TranslationForPreview[]) => {
      // Check if preview is supported for this project
      if (!isPreviewSupported(projectSlug)) {
        setError('Preview is not supported for this project type');
        return;
      }

      // Check if we have translations to preview
      if (!translations || translations.length === 0) {
        setError('No translations to preview');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Generate the preview URL
        const url = generatePreviewURL({
          projectSlug,
          locale,
          wpLocale: wpLocale || mapLocaleToWPLocale(locale),
          translations,
        });

        setPlaygroundURL(url);
        setIsOpen(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate preview';
        setError(message);
        console.error('Failed to generate Playground preview:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [projectSlug, locale, wpLocale]
  );

  /**
   * Close the Playground preview
   */
  const closePreview = useCallback(() => {
    setIsOpen(false);
    setPlaygroundURL(null);
    setError(null);
  }, []);

  return {
    isOpen,
    isLoading,
    playgroundURL,
    error,
    openPreview,
    closePreview,
  };
}

export default usePlayground;
