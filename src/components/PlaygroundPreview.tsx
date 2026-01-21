/**
 * WordPress Playground Preview Component
 * Full-screen overlay that displays a live WordPress environment with translations
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';

interface PlaygroundPreviewProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}

/**
 * Full-screen overlay component for WordPress Playground preview
 */
const PlaygroundPreview: React.FC<PlaygroundPreviewProps> = ({
  url,
  isOpen,
  onClose,
  projectName,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset states when URL changes or component opens
  useEffect(() => {
    if (isOpen && url) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [isOpen, url]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when overlay is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle iframe load events
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Reload the iframe
  const handleReload = () => {
    setIsLoading(true);
    setHasError(false);
    // Force iframe to reload by briefly clearing and resetting the src
    const iframe = document.getElementById('playground-iframe') as HTMLIFrameElement;
    if (iframe) {
      const currentSrc = iframe.src;
      iframe.src = '';
      setTimeout(() => {
        iframe.src = currentSrc;
      }, 100);
    }
  };

  // Open in new tab
  const handleOpenExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="playground-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="playground-title"
    >
      {/* Header */}
      <header className="playground-header">
        <div className="playground-header-content">
          <h2 id="playground-title" className="playground-title">
            {t('playground.title', 'Translation Preview')}
          </h2>
          {projectName && (
            <span className="playground-project">{projectName}</span>
          )}
        </div>

        <div className="playground-actions">
          <button
            className="playground-action-btn"
            onClick={handleReload}
            title={t('playground.reload', 'Reload')}
            aria-label={t('playground.reload', 'Reload')}
          >
            <RefreshCw size={20} />
          </button>
          <button
            className="playground-action-btn"
            onClick={handleOpenExternal}
            title={t('playground.open_external', 'Open in new tab')}
            aria-label={t('playground.open_external', 'Open in new tab')}
          >
            <ExternalLink size={20} />
          </button>
          <button
            className="playground-close-btn"
            onClick={onClose}
            title={t('playground.close', 'Close preview')}
            aria-label={t('playground.close', 'Close preview')}
          >
            <X size={24} />
          </button>
        </div>
      </header>

      {/* Content area */}
      <div className="playground-content">
        {/* Loading overlay */}
        {isLoading && (
          <div className="playground-loading">
            <Loader className="animate-spin" size={48} />
            <p className="playground-loading-text">
              {t('playground.loading', 'Starting WordPress Playground...')}
            </p>
            <p className="playground-loading-hint">
              {t('playground.loading_hint', 'This may take a moment on first load')}
            </p>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="playground-error">
            <AlertCircle size={48} />
            <h3>{t('playground.error_title', 'Failed to load preview')}</h3>
            <p>{t('playground.error_message', 'There was a problem loading WordPress Playground.')}</p>
            <div className="playground-error-actions">
              <button className="btn-primary" onClick={handleReload}>
                {t('playground.try_again', 'Try Again')}
              </button>
              <button className="btn-outline" onClick={handleOpenExternal}>
                {t('playground.open_external', 'Open in new tab')}
              </button>
            </div>
          </div>
        )}

        {/* Iframe */}
        <iframe
          id="playground-iframe"
          className="playground-iframe"
          src={url}
          title={t('playground.iframe_title', 'WordPress Playground Preview')}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>

      {/* Footer with hint */}
      <footer className="playground-footer">
        <p className="playground-footer-hint">
          {t('playground.footer_hint', 'This is a preview environment. Translations shown here may differ from the final result.')}
        </p>
      </footer>
    </div>
  );
};

export default PlaygroundPreview;
