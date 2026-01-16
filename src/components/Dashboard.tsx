import { useTranslation, Trans } from 'react-i18next';
import { ShieldCheck, Check } from 'lucide-react';
import type { GravatarProfile, Project } from '../types';
import wapuuImage from '../imgs/original_wapuu.png';

interface Stats {
  translated: number;
  approved: number;
}

interface DashboardProps {
  stats: Stats;
  onStart: () => Promise<void>;
  user: GravatarProfile | null;
  onLogout: () => void;
  isSessionLoading: boolean;
  currentProject: Project;
  availableProjects: Project[];
  onProjectChange: (projectId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  stats,
  onStart,
  user,
  onLogout,
  isSessionLoading,
  currentProject,
  availableProjects,
  onProjectChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="screen animate-fade-in">
      <header className="header-navy">
        <div className="header-top">
          <h1>{t('dashboard.title')}</h1>
          <div className="user-avatar" onClick={onLogout} title={t('dashboard.logout_tooltip')}>
            <img
              src={user?.avatar_url || wapuuImage}
              alt={user?.display_name || t('alt.user')}
            />
          </div>
        </div>

        <div className="stats-card-container">
          <div className="stat-card">
            <div className="stat-card-icon translated">
              <ShieldCheck size={24} />
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{stats.translated}</span>
              <span className="stat-card-label">{t('dashboard.stats.translated')}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon approved">
              <Check size={24} />
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{stats.approved}</span>
              <span className="stat-card-label">{t('dashboard.stats.approved')}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="welcome-text">
          <Trans
            i18nKey="dashboard.welcome"
            values={{ name: user?.display_name || 'Translator' }}
            components={{ strong: <strong /> }}
          />
        </div>

        <div className="dashboard-action-row">
          <select
            className="project-select"
            value={currentProject?.id || ''}
            onChange={(e) => onProjectChange(e.target.value)}
            disabled={isSessionLoading || !availableProjects.length}
          >
            {availableProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button className="btn-primary" onClick={onStart} disabled={isSessionLoading || !currentProject}>
            {isSessionLoading ? t('dashboard.loading_button') : t('dashboard.start_button')}
          </button>
        </div>

        <div className="mascot-container animate-bounce">
          <img src={wapuuImage} alt={t('alt.wapuu_happy')} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
