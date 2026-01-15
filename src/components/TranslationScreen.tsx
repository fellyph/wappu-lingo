import { Check, SkipForward, Loader } from 'lucide-react';
import type { TranslationString, Locale, Project } from '../types';
import wapuuImage from '../imgs/original_wapuu.png';

interface TranslationScreenProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  // Loading state
  if (isLoading) {
    return (
      <div className="screen animate-fade-in loading-container">
        <Loader className="animate-spin" size={48} />
        <p>Loading strings...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="screen animate-fade-in error-container">
        <p className="error-message">{error}</p>
        <button className="btn-outline" onClick={onBack}>
          Go Back
        </button>
      </div>
    );
  }

  // No strings available
  if (!currentString) {
    return (
      <div className="screen animate-fade-in empty-container">
        <div className="mascot-container">
          <img src={wapuuImage} alt="Wapuu" />
        </div>
        <p className="empty-message">No untranslated strings found for {locale.name}.</p>
        <p className="empty-submessage">
          Try selecting a different project or language in Settings.
        </p>
        <button className="btn-outline" onClick={onBack}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="screen animate-fade-in">
      <header className="header-minimal">
        <h2>Translate to: {locale.name}</h2>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <div className="content">
        <div className="card">
          <div className="card-header">
            <span className="card-label">Original String:</span>
            <span className="badge">
              {currentString.priority === 'high' ? 'Priority' : 'Normal'}
            </span>
          </div>

          <div className="string-display">{currentString.singular}</div>

          {currentString.context && <p className="context">Context: {currentString.context}</p>}

          <p className="source">
            Source: {project.name}
            {currentString.references?.length > 0 && (
              <span className="reference"> ({currentString.references[0]})</span>
            )}
          </p>

          <div className="input-group">
            <label>Your Translation:</label>
            <input type="text" placeholder="Translate here..." value={value} onChange={onChange} />
          </div>

          <div className="button-row">
            <button className="btn-secondary" onClick={onSkip}>
              Skip <SkipForward size={18} />
            </button>
            <button className="btn-success" onClick={onSubmit} disabled={!value.trim()}>
              Submit <Check size={20} />
            </button>
          </div>

          <div className="mascot-peek">
            <img src={wapuuImage} alt="Wapuu peaking" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationScreen;
