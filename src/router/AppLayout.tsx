import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Users, ShieldCheck, Settings } from 'lucide-react';

export const AppLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide bottom nav during translation or summary screens
  const hideNav =
    location.pathname === '/translate' || location.pathname === '/summary';

  return (
    <div className="app-container">
      <main className="content-scroll">
        <Outlet />
      </main>

      {!hideNav && (
        <nav className="bottom-nav" aria-label={t('nav.main')}>
          <button
            className={location.pathname === '/' ? 'active' : ''}
            onClick={() => navigate('/')}
            aria-label={t('nav.home')}
            aria-current={location.pathname === '/' ? 'page' : undefined}
          >
            <Home size={24} aria-hidden="true" />
          </button>
          <button
            className={location.pathname === '/activity' ? 'active' : ''}
            onClick={() => navigate('/activity')}
            aria-label={t('nav.activity')}
            aria-current={location.pathname === '/activity' ? 'page' : undefined}
          >
            <Users size={24} aria-hidden="true" />
          </button>
          <button aria-label={t('nav.badges')} disabled>
            <ShieldCheck size={24} aria-hidden="true" />
          </button>
          <button
            className={location.pathname === '/settings' ? 'active' : ''}
            onClick={() => navigate('/settings')}
            aria-label={t('nav.settings')}
            aria-current={location.pathname === '/settings' ? 'page' : undefined}
          >
            <Settings size={24} aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
};
