import type { GravatarProfile } from '../types';
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
}

const Dashboard: React.FC<DashboardProps> = ({
  stats,
  onStart,
  user,
  onLogout,
  isSessionLoading,
}) => (
  <div className="screen animate-fade-in">
    <header className="header-navy">
      <div className="header-top">
        <h1>WordPress Translator</h1>
        <div className="user-avatar" onClick={onLogout} title="Click to Logout">
          <img
            src={user?.avatar_url || wapuuImage}
            alt={user?.display_name || 'User'}
          />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Translated:</span>
          <span className="stat-value">{stats.translated}</span>
        </div>
        <div className="stat-item">
          <div className="icon-wp-small">
            <img src={wapuuImage} alt="WP" />
          </div>
          <div className="stat-stack">
            <span className="stat-label">Approved:</span>
            <span className="stat-value">{stats.approved}</span>
          </div>
        </div>
      </div>
    </header>

    <div className="dashboard-content">
      <div className="welcome-text">
        Welcome back, <strong>{user?.display_name || 'Translator'}</strong>!
      </div>
      <button className="btn-primary" onClick={onStart} disabled={isSessionLoading}>
        {isSessionLoading ? 'Loading...' : 'Start Translating!'}
      </button>

      <div className="mascot-container animate-bounce">
        <img src={wapuuImage} alt="Happy Wapuu" />
      </div>
    </div>
  </div>
);

export default Dashboard;
