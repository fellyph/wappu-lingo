import { useTranslation } from 'react-i18next';
import { Check, SkipForward, Loader, Home, Eye } from 'lucide-react';
import type { TranslationString, Locale, Project } from '../types';
import wapuuImage from '../imgs/original_wapuu.png';
import searchWapuuImage from '../imgs/search-wapuu.png';
import AudioInput from './AudioInput';
import PlaygroundPreview from './PlaygroundPreview';
import { usePlayground } from '../hooks/usePlayground';

interface TranslationScreenProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTranscription: (text: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  currentString: TranslationString | null;
  progressPercent: number;
  locale: Locale;
  project: Project;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
}

const TranslationScreen: React.FC<TranslationScreenProps> = ({
  value,
  onChange,
  onTranscription,
  onSubmit,
  onSkip,
  currentString,
  progressPercent,
  locale,
  project,
  isLoading,
  error,
  onBack,
}) => {
  const { t } = useTranslation();

  // Playground preview hook
  const {
    isOpen: isPreviewOpen,
    isLoading: isPreviewLoading,
    playgroundURL,
    openPreview,
    closePreview,
  } = usePlayground({
    projectSlug: project.slug,
    locale: locale.code,
    wpLocale: locale.wpLocale,
  });

  // Handle preview button click
  const handlePreview = () => {
    if (currentString && value.trim()) {
      openPreview([
        {
          original: currentString.singular,
          translation: value.trim(),
          context: currentString.context || undefined,
          plural: currentString.plural || undefined,
        },
      ]);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="screen animate-fade-in loading-container">
        <Loader className="animate-spin" size={48} />
        <p>{t('translation.loading')}</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="screen animate-fade-in error-container">
        <p className="error-message">{error}</p>
        <button className="btn-outline" onClick={onBack}>
          {t('translation.go_back')}
        </button>
      </div>
    );
  }

  // No strings available - show search state
  if (!currentString) {
    return (
      <div className="screen animate-fade-in empty-state-screen">
        <div className="empty-state-card">
          <div className="empty-state-mascot">
            <img src={searchWapuuImage} alt={t('alt.wapuu_search')} />
          </div>
          <div className="empty-state-content">
            <div className="empty-state-badge empty-state-badge-search">
              <Check size={16} />
              <span>{t('translation.all_done_badge')}</span>
            </div>
            <h2 className="empty-state-title">
              {t('translation.no_strings', { locale: locale.name })}
            </h2>
            <p className="empty-state-description">
              {t('translation.no_strings_hint')}
            </p>
          </div>
          <div className="empty-state-actions">
            <button className="btn-primary-back" onClick={onBack}>
              <Home size={20} />
              {t('translation.go_back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen animate-fade-in">
      <header className="header-minimal">
        <h2>{t('translation.translate_to', { locale: locale.name })}</h2>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <div className="content">
        <div className="card">
          <div className="card-header">
            <span className="card-label">{t('translation.original_string')}</span>
            <div className="card-badges">
              <span className={`badge badge-project badge-project-${project.id}`}>
                {project.name}
              </span>
              <span className="badge">
                {currentString.priority === 'high'
                  ? t('translation.priority.high')
                  : t('translation.priority.normal')}
              </span>
            </div>
          </div>

          <div className="string-display">{currentString.singular}</div>

          {currentString.context && (
            <p className="context">{t('translation.context', { context: currentString.context })}</p>
          )}

          <p className="source">
            {t('translation.source', { project: project.name })}
            {currentString.references?.length > 0 && (
              <span className="reference"> ({currentString.references[0]})</span>
            )}
          </p>

          <div className="input-group">
            <label>{t('translation.your_translation')}</label>
            <input
              type="text"
              placeholder={t('translation.placeholder')}
              value={value}
              onChange={onChange}
            />
            <AudioInput
              onTranscription={onTranscription}
              targetLocale={locale.code}
            />
          </div>

          {/* Preview button */}
          <button
            className="btn-preview"
            onClick={handlePreview}
            disabled={!value.trim() || isPreviewLoading}
            title={t('translation.preview_in_wordpress', 'Preview in WordPress')}
          >
            <Eye size={18} />
            {isPreviewLoading
              ? t('translation.preview_loading', 'Loading...')
              : t('translation.preview', 'Preview')}
          </button>

          <div className="button-row">
            <button className="btn-secondary" onClick={onSkip}>
              {t('translation.skip')} <SkipForward size={18} />
            </button>
            <button className="btn-success" onClick={onSubmit} disabled={!value.trim()}>
              {t('translation.submit')} <Check size={20} />
            </button>
          </div>

          <div className="mascot-peek">
            <img src={wapuuImage} alt={t('alt.wapuu_peek')} />
          </div>
        </div>
      </div>

      {/* Playground Preview Overlay */}
      {isPreviewOpen && playgroundURL && (
        <PlaygroundPreview
          url={playgroundURL}
          isOpen={isPreviewOpen}
          onClose={closePreview}
          projectName={project.name}
        />
      )}
    </div>
  );
};

export default TranslationScreen;
