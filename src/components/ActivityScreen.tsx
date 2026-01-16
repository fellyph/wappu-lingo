import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, FileText, Globe, Loader, ChevronRight, ArrowRight } from 'lucide-react';
import { fetchUserTranslations, fetchUserStats } from '../services/translations';
import type { TranslationRecord } from '../types';
import wapuuImage from '../imgs/original_wapuu.png';

interface WeeklyStats {
  approved: number;
  total: number;
}

interface ActivityScreenProps {
  userId: string | null;
}

const ActivityScreen: React.FC<ActivityScreenProps> = ({ userId }) => {
  const { t } = useTranslation();
  const [translations, setTranslations] = useState<TranslationRecord[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({ approved: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllTranslations, setShowAllTranslations] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch translations and stats in parallel
        const [translationsResponse, statsResponse] = await Promise.all([
          fetchUserTranslations(userId, { limit: 50 }),
          fetchUserStats(userId),
        ]);
        setTranslations(translationsResponse.translations);
        setWeeklyStats({
          approved: statsResponse.byStatus['approved'] || 0,
          total: statsResponse.total || 0,
        });
      } catch (err) {
        // In development, the API might not be available
        // Show empty state instead of error
        console.warn('Failed to load activity data:', err);
        setTranslations([]);
        setWeeklyStats({ approved: 0, total: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('activity.time.just_now');
    if (diffMins < 60) return t('activity.time.minutes_ago', { count: diffMins });
    if (diffHours < 24) return t('activity.time.hours_ago', { count: diffHours });
    if (diffDays < 7) return t('activity.time.days_ago', { count: diffDays });
    
    return date.toLocaleDateString();
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'submitted': return 'status-submitted';
      default: return 'status-pending';
    }
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="screen animate-fade-in loading-container">
        <Loader className="animate-spin" size={48} />
        <p>{t('activity.loading')}</p>
      </div>
    );
  }

  // Weekly Summary Card view
  if (!showAllTranslations) {
    return (
      <div className="screen animate-fade-in weekly-summary-screen">
        <div className="weekly-summary-card">
          <h2 className="weekly-summary-title">{t('activity.weekly_summary')}</h2>

          <div className="weekly-summary-stats-card">
            <p className="weekly-summary-label">{t('activity.strings_approved_week')}</p>
            <div className="weekly-summary-stats-row">
              <div className="weekly-summary-wapuu-small">
                <img src={wapuuImage} alt={t('alt.wapuu')} />
              </div>
              <div className="weekly-summary-approved">
                <span className="weekly-summary-approved-label">{t('activity.approved')}:</span>
                <span className="weekly-summary-approved-value">{weeklyStats.approved}</span>
              </div>
              <div className="weekly-summary-wapuu-happy">
                <img src={wapuuImage} alt={t('alt.wapuu_happy')} />
              </div>
            </div>
            <p className="weekly-summary-message">
              {weeklyStats.approved > 0
                ? t('activity.great_job_message')
                : t('activity.keep_going_message')}
            </p>
          </div>

          <button
            className="btn-outline weekly-summary-btn"
            onClick={() => setShowAllTranslations(true)}
          >
            {t('activity.view_all_translations')} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // All Translations list view
  return (
    <div className="screen animate-fade-in">
      <header className="header-navy activity-header">
        <div className="header-top">
          <h1>{t('activity.title')}</h1>
          <div className="activity-icon-badge">
            <Clock size={24} />
          </div>
        </div>
        <p className="activity-subtitle">{t('activity.subtitle')}</p>
      </header>

      <div className="activity-content">
        {/* Back to Summary button */}
        <button
          className="activity-back-btn"
          onClick={() => setShowAllTranslations(false)}
        >
          <ChevronRight size={16} className="activity-back-icon" />
          {t('activity.back_to_summary')}
        </button>

        {error && (
          <div className="activity-error">
            <p>{error}</p>
          </div>
        )}

        {!error && translations.length === 0 && (
          <div className="activity-empty">
            <FileText size={48} className="activity-empty-icon" />
            <h3>{t('activity.empty_title')}</h3>
            <p>{t('activity.empty_message')}</p>
          </div>
        )}

        {!error && translations.length > 0 && (
          <div className="activity-list">
            {translations.map((item, index) => (
              <div
                key={item.id || index}
                className="activity-item"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="activity-item-header">
                  <div className="activity-project">
                    <Globe size={14} />
                    <span>{item.project_name || item.project_slug}</span>
                  </div>
                  <span className={`activity-status ${getStatusClass(item.status)}`}>
                    {t(`activity.status.${item.status}`)}
                  </span>
                </div>

                <div className="activity-item-body">
                  <div className="activity-original">
                    <span className="activity-label">{t('activity.original')}:</span>
                    <span className="activity-text">{truncateText(item.original_string)}</span>
                  </div>
                  <div className="activity-arrow">
                    <ChevronRight size={16} />
                  </div>
                  <div className="activity-translation">
                    <span className="activity-label">{t('activity.translation')}:</span>
                    <span className="activity-text">{truncateText(item.translation)}</span>
                  </div>
                </div>

                <div className="activity-item-footer">
                  <span className="activity-locale">{item.locale}</span>
                  <span className="activity-time">{formatDate(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityScreen;
