import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { useTranslationSessionContext } from '../../context/TranslationSessionContext';
import TranslationScreen from '../../components/TranslationScreen';

export const TranslatePage = () => {
  const navigate = useNavigate();
  const settings = useSettings();
  const session = useTranslationSessionContext();

  // Check if session is complete and navigate to summary
  useEffect(() => {
    if (session.isSessionComplete) {
      navigate('/summary');
    }
  }, [session.isSessionComplete, navigate]);

  // Redirect to home if no session is active (no strings loaded)
  useEffect(() => {
    if (
      !session.isLoading &&
      session.strings.length === 0 &&
      !session.error
    ) {
      // Only redirect if we truly have no session (not during loading)
      const timeout = setTimeout(() => {
        if (session.strings.length === 0 && !session.isLoading) {
          navigate('/');
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [session.strings.length, session.isLoading, session.error, navigate]);

  const handleSubmit = () => {
    session.submitTranslation(session.translationValue);
    session.setTranslationValue('');

    // Check if this was the last string
    if (session.currentIndex + 1 >= session.strings.length) {
      navigate('/summary');
    }
  };

  const handleSkip = () => {
    session.skipString();
    session.setTranslationValue('');

    // Check if this was the last string
    if (session.currentIndex + 1 >= session.strings.length) {
      navigate('/summary');
    }
  };

  const handleBack = () => {
    session.setTranslationValue('');
    session.resetSession();
    navigate('/');
  };

  return (
    <TranslationScreen
      value={session.translationValue}
      onChange={(e) => session.setTranslationValue(e.target.value)}
      onTranscription={(text) => session.setTranslationValue(text)}
      onSubmit={handleSubmit}
      onSkip={handleSkip}
      currentString={session.currentString}
      progressPercent={session.progressPercent}
      locale={settings.localeObj}
      project={settings.project}
      isLoading={session.isLoading}
      error={session.error}
      onBack={handleBack}
    />
  );
};
