import { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
  Home,
  Users,
  ShieldCheck,
  Settings,
  Check,
  ArrowRight,
  LogIn,
  SkipForward,
  Loader,
} from 'lucide-react';
import { useSettings } from './hooks/useSettings';
import { useTranslationSession } from './hooks/useTranslationSession';
import { fetchUserStats } from './services/translations';
import SettingsScreen from './components/SettingsScreen';
import ActivityScreen from './components/ActivityScreen';
import type { GravatarProfile, TranslationString, Locale, Project, SessionStats } from './types';
import wapuuImage from './imgs/original_wapuu.png';
import searchWapuuImage from './imgs/search-wappu.png';

const CLIENT_ID = import.meta.env.VITE_GRAVATAR_CLIENT_ID || '1'; // Placeholder
const REDIRECT_URI = window.location.origin + '/';

type ScreenType = 'dashboard' | 'translating' | 'summary' | 'settings' | 'activity';

interface Stats {
  translated: number;
  approved: number;
}

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenType>('dashboard');
  const [stats, setStats] = useState<Stats>({ translated: 0, approved: 0 });
  const [translationValue, setTranslationValue] = useState('');
  const [user, setUser] = useState<GravatarProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('gravatar_token'));
  const [isLoading, setIsLoading] = useState(false);

  // Use new hooks
  const settings = useSettings();
  const session = useTranslationSession();

  // Fetch user stats from the database when user is loaded
  useEffect(() => {
    if (user) {
      const userId = user.hash || user.profile_url?.split('/').pop() || '';
      if (userId) {
        fetchUserStats(userId)
          .then((userStats) => {
            setStats({
              translated: userStats.total,
              approved: userStats.byStatus['approved'] || 0,
            });
          })
          .catch(() => {
            // Keep default stats on error
          });
      }
    }
  }, [user]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setToken(accessToken);
        localStorage.setItem('gravatar_token', accessToken);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (token && !user) {
      setIsLoading(true);
      fetch('https://api.gravatar.com/v3/me/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json() as Promise<GravatarProfile>)
        .then((data) => {
          if (data.error) {
            localStorage.removeItem('gravatar_token');
            setToken(null);
          } else {
            setUser(data);
          }
        })
        .catch(() => setToken(null))
        .finally(() => setIsLoading(false));
    }
  }, [token, user]);

  const handleLogin = () => {
    const scopes = ['auth', 'gravatar-profile:read'].map((s, i) => `scope[${i}]=${s}`).join('&');
    const authUrl = `https://public-api.wordpress.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&${scopes}`;
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    localStorage.removeItem('gravatar_token');
    setToken(null);
    setUser(null);
  };

  const handleStart = async () => {
    setScreen('translating');
    await session.startSession({
      projectSlug: settings.project.slug,
      projectName: settings.project.name,
      localeSlug: settings.locale,
      sampleSize: settings.stringsPerSession,
      userId: user?.hash || user?.profile_url?.split('/').pop() || 'anonymous',
      userEmail: user?.email || null,
    });
  };

  const handleSubmit = () => {
    session.submitTranslation(translationValue);
    setTranslationValue('');
    setStats((prev) => ({ ...prev, translated: prev.translated + 1 }));

    // Check if session is complete
    if (session.currentIndex + 1 >= session.strings.length) {
      setScreen('summary');
    }
  };

  const handleSkip = () => {
    session.skipString();
    setTranslationValue('');

    if (session.currentIndex + 1 >= session.strings.length) {
      setScreen('summary');
    }
  };

  const handleBackToHome = () => {
    setTranslationValue('');
    session.resetSession();
    setScreen('dashboard');
  };

  const { t } = useTranslation();

  if (!token && !isLoading) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (isLoading) {
    return <div className="loading-screen">{t('app.loading')}</div>;
  }

  return (
    <div className="app-container">
      <main className="content-scroll">
        {screen === 'dashboard' && (
          <Dashboard
            stats={stats}
            onStart={handleStart}
            user={user}
            onLogout={handleLogout}
            isSessionLoading={session.isLoading}
          />
        )}
        {screen === 'translating' && (
          <TranslationScreen
            value={translationValue}
            onChange={(e) => setTranslationValue(e.target.value)}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            currentString={session.currentString}
            progressPercent={session.progressPercent}
            locale={settings.localeObj}
            project={settings.project}
            isLoading={session.isLoading}
            error={session.error}
            onBack={() => setScreen('dashboard')}
          />
        )}
        {screen === 'summary' && (
          <SummaryScreen onDone={handleBackToHome} sessionStats={session.sessionStats} />
        )}
        {screen === 'settings' && (
          <SettingsScreen
            settings={settings}
            onLocaleChange={settings.setLocale}
            onProjectChange={settings.setProject}
            onStringsPerSessionChange={settings.setStringsPerSession}
          />
        )}
        {screen === 'activity' && (
          <ActivityScreen
            userId={user?.hash || user?.profile_url?.split('/').pop() || null}
          />
        )}
      </main>

      <nav className="bottom-nav">
        <button
          className={screen === 'dashboard' ? 'active' : ''}
          onClick={() => setScreen('dashboard')}
        >
          <Home size={24} />
        </button>
        <button
          className={screen === 'activity' ? 'active' : ''}
          onClick={() => setScreen('activity')}
        >
          <Users size={24} />
        </button>
        <button>
          <ShieldCheck size={24} />
        </button>
        <button
          className={screen === 'settings' ? 'active' : ''}
          onClick={() => setScreen('settings')}
        >
          <Settings size={24} />
        </button>
      </nav>
    </div>
  );
};

/* --- Sub-Components --- */

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
        <button className="btn-primary" onClick={onStart} disabled={isSessionLoading}>
          {isSessionLoading ? t('dashboard.loading_button') : t('dashboard.start_button')}
        </button>

        <div className="mascot-container animate-bounce">
          <img src={wapuuImage} alt={t('alt.wapuu_happy')} />
        </div>
      </div>
    </div>
  );
};

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { t } = useTranslation();

  return (
    <div className="login-container animate-fade-in">
      <div className="login-card">
        <div className="login-mascot">
          <img src={wapuuImage} alt={t('alt.wapuu')} />
        </div>
        <h1>{t('app.name')}</h1>
        <p>{t('login.tagline')}</p>

        <button className="btn-login" onClick={onLogin}>
          <LogIn size={20} style={{ marginRight: 10 }} /> {t('login.button')}
        </button>

        <div className="login-footer">{t('login.footer')}</div>
      </div>
    </div>
  );
};

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
  const { t } = useTranslation();

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
            <span className="badge">
              {currentString.priority === 'high'
                ? t('translation.priority.high')
                : t('translation.priority.normal')}
            </span>
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
          </div>

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
    </div>
  );
};

interface SummaryScreenProps {
  onDone: () => void;
  sessionStats: SessionStats;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({ onDone, sessionStats }) => {
  const { t } = useTranslation();

  return (
    <div
      className="screen animate-fade-in"
      style={{ background: 'var(--color-navy)', minHeight: '100%', padding: '24px' }}
    >
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

export default App;