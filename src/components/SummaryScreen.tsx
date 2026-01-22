import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import type { SessionStats } from '../types';

interface SummaryScreenProps {
  onDone: () => void;
  sessionStats: SessionStats;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({ onDone, sessionStats }) => {
  const { t } = useTranslation();

  return (
    <div className="screen summary-screen animate-fade-in">
      <div className="summary-card">
        <h2 className="summary-title">{t('summary.title')}</h2>

        <div className="weekly-stats-card">
          <p className="stats-header">{t('summary.this_session')}</p>
          <div className="session-stats-grid">
            <div className="session-stat">
              <span className="session-stat-value">{sessionStats?.completed || 0}</span>
              <span className="session-stat-label">{t('summary.translated')}</span>
            </div>
            <div className="session-stat">
              <span className="session-stat-value">{sessionStats?.skipped || 0}</span>
              <span className="session-stat-label">{t('summary.skipped')}</span>
            </div>
            <div className="session-stat">
              <span className="session-stat-value">{sessionStats?.total || 0}</span>
              <span className="session-stat-label">{t('summary.total')}</span>
            </div>
          </div>
        </div>

        <p className="message">
          {sessionStats?.completed > 0
            ? t('summary.success_message')
            : t('summary.empty_message')}
        </p>

        <button className="btn-outline" onClick={onDone}>
          {t('summary.back_button')} <ArrowRight size={20} style={{ marginLeft: 8 }} />
        </button>
      </div>
    </div>
  );
};

export default memo(SummaryScreen);
