import { useNavigate } from 'react-router-dom';
import { useTranslationSessionContext } from '../../context/TranslationSessionContext';
import SummaryScreen from '../../components/SummaryScreen';

export const SummaryPage = () => {
  const navigate = useNavigate();
  const session = useTranslationSessionContext();

  const handleDone = () => {
    session.setTranslationValue('');
    session.resetSession();
    navigate('/');
  };

  return <SummaryScreen onDone={handleDone} sessionStats={session.sessionStats} />;
};
